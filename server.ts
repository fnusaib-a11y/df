/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY || '';
  let ai: GoogleGenAI | null = null;
  
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), hasGemini: !!ai });
  });

  // AI-Powered Caption Generation using Google GenAI SDK
  app.post('/api/gemini/suggest-caption', async (req, res) => {
    const prompt = req.body?.prompt;
    const language = req.body?.language || 'bn';

    try {
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!ai) {
        // Return fallback captions if API key is not specified
        const fallbackCaptions = [
          `শুভ সকাল বন্ধুরা! ফ্লো অ্যাপে আজকে চমৎকার সময় কাটছে। 😇✨ #Flow #GoodVibes`,
          `নতুন প্রযুক্তির উদ্ভাবন আমাদের জীবনকে আরও সহজ করে তোলে। আপনার মতামত কি? 📱💡 #Tech #Future`,
          `আজকের দিনটি সত্যিই অসাধারণ! চলুন পজিটিভ এনার্জি ছড়াই। 🌱💖 #Life #Inspiration`,
          `একটি সুন্দর মূহুর্ত, আর কিছু দারুণ স্মৃতি। 📸✨ #Memories #Aesthetic`
        ];
        const randomCaption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
        return res.json({ caption: `${prompt}... ${randomCaption}` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate a short modern social media post caption (1 to 3 lines max) about this topic or prompt: "${prompt}". The language of the caption must be primary Bengali (বাঙালি) or English based on prompt intent, natural sounding, and include 2-3 matching emojis and a couple of relevant hashtags. Provide ONLY the final caption text. Do not add introductory or surrounding feedback.`,
        config: {
          systemInstruction: "You are 'FlowAI', a smart creative copywriter. You write highly engaging, cheerful, and crisp social media captions in natural, friendly Bengali and English. Add natural emojis and hashtags easily."
        }
      });

      const captionText = response.text || '';
      res.json({ caption: captionText.trim() });
    } catch (error: any) {
      console.error('Gemini API Error (using robust fallback):', error);
      
      // Generate custom elegant caption dynamically using the prompt as fallback
      const cleanPrompt = prompt ? String(prompt).trim() : '';
      let fallbackCaption = '';
      
      if (cleanPrompt) {
        fallbackCaption = `📸 ${cleanPrompt} — আজকের চমৎকার একটি মূহুর্ত! সকলের সাথে শেয়ার করে নিলাম। ভালো লাগলে ফলো করতে ভুলবেন না! ❤️✨ #Trending #MyMoment`;
      } else {
        const fallbacks = [
          `শুভ সকাল বন্ধুরা! ফ্লো অ্যাপে আজকে চমৎকার সময় কাটছে। 😇✨ #Flow #GoodVibes`,
          `নতুন প্রযুক্তির উদ্ভাবন আমাদের জীবনকে আরও সহজ করে তোলে। আপনার মতামত কি? 📱💡 #Tech #Future`,
          `আজকের দিনটি সত্যিই অসাধারণ! চলুন পজিটিভ এনার্জি ছড়াই। 🌱💖 #Life #Inspiration`,
          `একটি সুন্দর মূহুর্ত, আর কিছু দারুণ স্মৃতি। 📸✨ #Memories #Aesthetic`
        ];
        fallbackCaption = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      }
      
      res.json({ 
        caption: fallbackCaption, 
        fallback: true,
        errorDetails: error.message || 'Service unavailable'
      });
    }
  });

  // Serve static assets or mount Vite Dev Server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Flow Server] Server running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[Flow Server] Direct startup crash:', err);
});
