const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatConversation = require('../models/ChatConversation');

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-') && process.env.OPENAI_API_KEY.length > 20) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    const systemPrompt = `${baseSystemPrompt}\n\n## REAL-TIME CONTEXT\nThe exact current date and time right now is: ${currentTimeString}. You can use this to say 'Good morning', 'Good evening', or answer questions about what time it is!`;
    const contents = [];
    conversation.messages.forEach(m => {
      contents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      });
    });

    // Extract isVoice flag from request to determine which API key to use
    const { isVoice } = req.body;

    // Use environment variable for API key
    const geminiKey = process.env.GEMINI_API_KEY;
      
    let reply = '';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: contents
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          reply = data.candidates[0].content.parts[0].text;
        } else {
          reply = "The AI generated an empty response. Please try again.";
        }
      } else if (response.status === 429) {
        // Handle Google Free Tier Rate Limit gracefully
        reply = "Whoa bhai, we are talking too fast! Google's free AI has a speed limit of 15 messages per minute. Just wait about 60 seconds and then we can continue our session!";
      } else {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        const errorText = errorData.error?.message || 'Unknown API Error';
        reply = `AI API Error: ${errorText}`;
      }
    } catch (err) {
      console.error('Gemini API call failed:', err.message);
      reply = `Failed to contact AI: ${err.message}`;
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
      throw new Error('Please provide an imageBase64 string');
    }

    if (!genAI) {
      res.status(500);
      throw new Error('Gemini API key is missing. Please add GEMINI_API_KEY to your .env file.');
    }

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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];

    let textResponse = '{}';
    try {
      const result = await model.generateContent([promptText, ...imageParts]);
      const response = await result.response;
      textResponse = response.text() || '{}';
    } catch (apiError) {
      console.error("Gemini API Error:", apiError);
      if (apiError.status === 429 || apiError?.message?.includes('429') || apiError?.message?.includes('quota')) {
        console.log("Rate limit reached in scanFood.");
        return res.status(429).json({ success: false, error: 'Google Gemini API limit reached. Please wait 1 minute before scanning again.' });
      }
      throw apiError;
    }
    
    // Clean markdown if OpenAI accidentally included it
    textResponse = textResponse.replace(/```json|```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResponse);
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
    console.error('Error Details:', error);
    next(error);
  }
};

exports.searchFoodText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400);
      throw new Error('Please provide food text to search');
    }

    if (!genAI) {
      res.status(500);
      throw new Error('Gemini API key is missing. Please add GEMINI_API_KEY to your .env file.');
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    let textResponse = '{}';
    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      textResponse = response.text() || '{}';
    } catch (apiError) {
      console.error("Gemini API Error:", apiError);
      if (apiError.status === 429 || apiError?.message?.includes('429') || apiError?.message?.includes('quota')) {
        console.log("Rate limit reached in searchFoodText.");
        return res.status(429).json({ success: false, error: 'Google Gemini API limit reached. Please wait 1 minute before searching again.' });
      }
      throw apiError;
    }
    
    // Clean markdown if Gemini accidentally included it
    textResponse = textResponse.replace(/```json|```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResponse);
      throw new Error("Failed to generate nutrition data");
    }

    res.json({ success: true, nutritionData: parsedData });
  } catch (error) {
    console.error('Error Details:', error);
    next(error);
  }
};
