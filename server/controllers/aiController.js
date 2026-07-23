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
let groqClient = null;
function getGroq() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

async function createGroqCompletion(groq, params) {
  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i];
    try {
      return await groq.chat.completions.create({ ...params, model });
    } catch (err) {
      console.warn(`Groq model ${model} failed (${err.message}). Trying fallback model...`);
      if (i === GROQ_MODELS.length - 1) throw err;
    }
  }
}

// Gemini only for food image scanning (vision)
let nutritionGenAI = null;
if (process.env.GEMINI_NUTRITION_KEY || process.env.GEMINI_API_KEY) {
  nutritionGenAI = new GoogleGenerativeAI(process.env.GEMINI_NUTRITION_KEY || process.env.GEMINI_API_KEY);
}

// OpenRouter for Vision Food Scanning (Free, No Credit Card required)
let openrouterClient = null;
function getOpenRouter() {
  if (!openrouterClient && process.env.OPENROUTER_API_KEY) {
    openrouterClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'FitTrack AI',
      }
    });
  }
  return openrouterClient;
}

const OPENROUTER_VISION_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'openrouter/free'
];

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
      const groq = getGroq();
      if (!groq) throw new Error('Groq API key not configured');
      const completion = await createGroqCompletion(groq, {
        messages: groqMessages,
        temperature: 0.8,
        max_tokens: 1024,
      });
      reply = completion.choices[0].message.content || 'The AI generated an empty response. Please try again.';
    } catch (err) {
      console.error('AI Chat API call failed:', err.message);
      const section = isVoice ? 'voice' : 'chat';
      const { message: friendlyMsg } = getFriendlyAIError(err, section);
      reply = friendlyMsg;
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

    const promptText = `Analyze this food image in detail. Identify all visible dishes, ingredients, or meal items.
Return ONLY a valid JSON object — no markdown, no backticks, no preamble.

Schema:
{
  "foodName": string (e.g., "Paneer Butter Masala & Naan", "Grilled Chicken Salad", "Pepperoni Pizza Slice"),
  "servingSize": string (e.g., "1 plate", "250g", "1 bowl"),
  "calories": number (estimated total calories),
  "macros": { "carbs": number, "protein": number, "fat": number, "fiber": number },
  "micros": [
    { "label": "Calcium", "value": number, "unit": "mg", "daily": number },
    { "label": "Iron", "value": number, "unit": "mg", "daily": number },
    { "label": "Vitamin C", "value": number, "unit": "mg", "daily": number },
    { "label": "Potassium", "value": number, "unit": "mg", "daily": number },
    { "label": "Sodium", "value": number, "unit": "mg", "daily": number },
    { "label": "Vitamin A", "value": number, "unit": "mcg", "daily": number },
    { "label": "Magnesium", "value": number, "unit": "mg", "daily": number },
    { "label": "Zinc", "value": number, "unit": "mg", "daily": number }
  ],
  "fitScore": number (0–100),
  "badge": string (one of: "very healthy", "high protein", "balanced", "high carb", "high fat", "light meal"),
  "insight": string (2 sentences, fitness and health-focused insights on this meal)
}

Important Instructions:
- Accurately estimate calories and macros based on typical portion sizes.
- Always provide meaningful values for all 8 micro-nutrients.
- Return raw JSON only.`;

    let textResponse = null;

    // 1. Try OpenRouter Free Vision first (Zero Credit Card Required)
    const openrouter = getOpenRouter();
    if (openrouter) {
      const imageUrl = imageBase64.startsWith("data:image") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      for (const model of OPENROUTER_VISION_MODELS) {
        try {
          const completion = await openrouter.chat.completions.create({
            model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: promptText },
                  { type: "image_url", image_url: { url: imageUrl } }
                ]
              }
            ],
            temperature: 0.2
          });
          const resText = completion.choices[0]?.message?.content || "";
          if (resText.trim()) {
            textResponse = resText;
            console.log(`Food Scanner successfully processed via OpenRouter model: ${model}`);
            break;
          }
        } catch (orErr) {
          console.warn(`OpenRouter Vision model ${model} failed:`, orErr.message);
        }
      }
    }

    // 2. Fallback to Gemini if OpenRouter didn't return a response
    if (!textResponse && nutritionGenAI) {
      const mimeType = imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageParts = [{ inlineData: { data: base64Data, mimeType } }];

      try {
        const model = nutritionGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent([promptText, ...imageParts]);
        const response = await result.response;
        textResponse = response.text() || "{}";
      } catch (firstErr) {
        console.warn("First attempt failed in Gemini scanFood, retrying in 2s:", firstErr.message);
        await new Promise(r => setTimeout(r, 2000));
        try {
          const model = nutritionGenAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          const result = await model.generateContent([promptText, ...imageParts]);
          const response = await result.response;
          textResponse = response.text() || "{}";
        } catch (apiError) {
          console.error("Gemini Scan Food Error after retry:", apiError);
        }
      }
    }

    if (!textResponse) {
      const { status, message } = getFriendlyAIError(new Error('All vision providers busy'), 'scanner');
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

    const groq = getGroq();
    if (!groq) {
      const { status, message } = getFriendlyAIError(new Error('api key missing'), 'nutrition');
      return res.status(status).json({ success: false, error: message });
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
      const completion = await createGroqCompletion(groq, {
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