const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const ChatConversation = require('../models/ChatConversation');
const { getFriendlyAIError } = require('../utils/aiErrorHelper');

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-') && process.env.OPENAI_API_KEY.length > 20) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Groq for text chat, voice, food search, hydration
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Gemini only for food image scanning (vision)
let nutritionGenAI = null;
if (process.env.GEMINI_NUTRITION_KEY || process.env.GEMINI_API_KEY) {
  nutritionGenAI = new GoogleGenerativeAI(process.env.GEMINI_NUTRITION_KEY || process.env.GEMINI_API_KEY);
}

exports.getAllConversations = async (req, res, next) => {
  try {
    const conversations = await ChatConversation.find({ userId: req.user.id })
      .select('-messages')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.create({
      userId: req.user.id,
      title: 'New Chat',
      messages: [{
        sender: 'ai',
        text: "Hello! I am FitTrack AI Coach, your personal athletic consultant. Ask me anything about strength conditioning, cutting diets, or recovery schedules!"
      }]
    });
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

exports.getConversationById = async (req, res, next) => {
  try {
    const conversation = await ChatConversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400);
      return next(new Error('Please provide a message'));
    }

    const conversation = await ChatConversation.findOne({ _id: id, userId: req.user.id });
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    // Add user message
    conversation.messages.push({ sender: 'user', text: message });

    if (conversation.messages.length <= 2 && conversation.title === 'New Chat') {
      conversation.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    }

    const baseSystemPrompt = require('./systemPrompt');
    const currentTimeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long' });
    const systemPrompt = `${baseSystemPrompt}\n\n## REAL-TIME CONTEXT\nCurrent time: ${currentTimeString}`;
    
    // Only send last 10 messages to reduce token count and improve response speed
    const recentMessages = conversation.messages.slice(-10);
    const contents = [];
    recentMessages.forEach(m => {
      contents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      });
    });

    // Extract isVoice flag from request
    const { isVoice } = req.body;
    const label = isVoice ? '🎤 AI Voice Coach' : '🤖 AI Coach';

    // Build messages for Groq (OpenAI format)
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    let reply = '';
    try {
      if (!groq) throw new Error('Groq API key not configured');
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        temperature: 0.8,
        max_tokens: 1024,
      });
      reply = completion.choices[0].message.content || 'The AI generated an empty response. Please try again.';
    } catch (err) {
      console.error('Groq API call failed:', err.message);
      const errMsg = err?.message || '';
      if (errMsg.includes('429') || errMsg.includes('rate_limit')) {
        const isShortWait = errMsg.includes('Please try again in') && !errMsg.includes('day');
        reply = isShortWait
          ? `${label} is getting too many requests right now. Please wait 30 seconds and try again!`
          : `${label} has hit today's limit. It'll be back after 12:30 PM IST — fresh and ready!`;
      } else if (errMsg.includes('503') || errMsg.includes('Service Unavailable')) {
        reply = `${label} is handling peak traffic right now. Please wait a few seconds and send your message again!`;
      } else {
        reply = `${label} hit a snag. Please try again in a moment.`;
      }
    }

    conversation.messages.push({ sender: 'ai', text: reply });
    await conversation.save();

    res.json({ reply, conversation });
  } catch (error) {
    next(error);
  }
};

function generateFallbackCoachResponse(msg) {
  const m = msg.toLowerCase();
  
  const fitnessKeywords = ['workout', 'exercise', 'diet', 'protein', 'calorie', 'muscle', 'gym', 'run', 'cardio', 'weight', 'fat', 'fit', 'health', 'train', 'bench', 'squat', 'deadlift', 'coach', 'plan', 'eat', 'food', 'nutrition', 'water', 'sleep'];
  
  const isFitnessRelated = fitnessKeywords.some(kw => m.includes(kw));

  if (!isFitnessRelated) {
    return "I only answer questions related to fitness and health.";
  }

  if (m.includes('plan') || m.includes('schedule')) {
    return `Based on your recent activity, I suggest:\n1. **Caloric Target**: Maintain a slight deficit.\n2. **Protein**: 2.0g per kg of bodyweight.\n3. **Training**: 3 days lifting, 2 days cardio.\nKeep pushing!`;
  }
  
  if (m.includes('eat') || m.includes('food') || m.includes('diet')) {
    return `Nutrition is key! Focus on whole foods: lean meats, complex carbs (like oats and rice), and plenty of veggies. Drink at least 3 liters of water a day.`;
  }
  
  return `That's a great fitness question! Remember to maintain progressive overload in your lifts and prioritize recovery and sleep to see the best results. What specific muscle group are you targeting today?`;
}

exports.deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await ChatConversation.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.syncVoiceMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sender, text } = req.body;

    if (!sender || !text) {
      res.status(400);
      return next(new Error('Please provide sender and text'));
    }

    const conversation = await ChatConversation.findOne({ _id: id, userId: req.user.id });
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }

    conversation.messages.push({ sender, text });

    // Set title on first user message if it's "New Chat"
    if (sender === 'user' && conversation.messages.filter(m => m.sender === 'user').length === 1 && conversation.title === 'New Chat') {
      conversation.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
    }

    await conversation.save();
    res.json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

exports.scanFood = async (req, res, next) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400);
      throw new Error("Please provide an imageBase64 string");
    }

    if (!nutritionGenAI) {
      res.status(500);
      throw new Error("Gemini API key is missing for Food Scanner. Please add GEMINI_NUTRITION_KEY to your .env file.");
    }

    const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageParts = [{ inlineData: { data: base64Data, mimeType } }];

    const promptText = `Analyze this food image and return ONLY a JSON object — no markdown, no backticks, no preamble.

Schema:
{
  "foodName": string,
  "servingSize": string,
  "calories": number,
  "macros": { "carbs": number, "protein": number, "fat": number, "fiber": number },
  "micros": [
    { "label": string, "value": number, "unit": string, "daily": number }
  ],
  "fitScore": number (0–100),
  "badge": string (one of: "very healthy", "high protein", "balanced", "high carb", "high fat", "light meal"),
  "insight": string (2 sentences, fitness-focused)
}

micros must include: Calcium, Iron, Vitamin C, Potassium, Sodium, Vitamin A, Magnesium, Zinc.
All gram values should be realistic for a single serving. Return raw JSON only.`;

    const model = nutritionGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let textResponse = "{}";
    try {
      const result = await model.generateContent([promptText, ...imageParts]);
      const response = await result.response;
      textResponse = response.text() || "{}";
    } catch (apiError) {
      console.error("Gemini Scan Food Error:", apiError);
      const { status, message } = getFriendlyAIError(apiError, "scanner");
      return res.status(status).json({ success: false, error: message });
    }
    
    textResponse = textResponse.replace(/```json|```/g, "").trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini Scan Food JSON:", textResponse);
      parsedData = {
        foodName: "Unknown Food",
        servingSize: "1 plate",
        calories: 0,
        macros: { carbs: 0, protein: 0, fat: 0, fiber: 0 },
        micros: [],
        fitScore: 0,
        badge: "balanced",
        insight: "Could not clearly analyze the image. Please try a different photo."
      };
    }

    res.json({ success: true, nutritionData: parsedData });
  } catch (error) {
    console.error("Error Details:", error);
    next(error);
  }
};

exports.searchFoodText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400);
      throw new Error("Please provide food text to search");
    }

    if (!groq) {
      res.status(500);
      throw new Error("Groq API key is missing. Please add GROQ_API_KEY to your .env file.");
    }

    const promptText = `Analyze the following food item/meal: "${text}".
Return ONLY a JSON object containing its estimated realistic nutritional data. No markdown, no backticks, no preamble.

Schema:
{
  "foodName": string (The clean name of the food),
  "servingSize": string,
  "calories": number,
  "macros": { "carbs": number, "protein": number, "fat": number, "fiber": number },
  "micros": [
    { "label": string, "value": number, "unit": string, "daily": number }
  ],
  "fitScore": number (0–100),
  "badge": string (one of: "very healthy", "high protein", "balanced", "high carb", "high fat", "light meal"),
  "insight": string (2 sentences, fitness-focused insight about eating this)
}

micros must include: Calcium, Iron, Vitamin C, Potassium, Sodium, Vitamin A, Magnesium, Zinc.
All gram values should be realistic for the described serving. Return raw JSON only.`;

    let textResponse = "{}";
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptText }],
        temperature: 0.3,
      });
      textResponse = completion.choices[0].message.content || "{}";
    } catch (apiError) {
      console.error("Groq Food Search Error:", apiError);
      const { status, message } = getFriendlyAIError(apiError, "nutrition");
      return res.status(status).json({ success: false, error: message });
    }
    
    textResponse = textResponse.replace(/```json|```/g, "").trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Groq JSON:", textResponse);
      throw new Error("Failed to generate nutrition data");
    }

    res.json({ success: true, nutritionData: parsedData });
  } catch (error) {
    console.error("Error Details:", error);
    next(error);
  }
};