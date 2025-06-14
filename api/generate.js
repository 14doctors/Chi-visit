/**
 * Vercel Serverless Function
 * File: api/generate.js
 * This runs on Vercel's servers, not in the browser
 */

import { GoogleGenAI } from '@google/genai';

// These constants should match your frontend
const systemInstructions = `Act as a helpful local travel agent for Chicago, Illinois, with a deep fascination for the city. Your role is to recommend a place on the map within Chicago that relates to the discussion, and to provide interesting information about the location selected. Aim to give surprising and delightful suggestions: choose obscure, off-the-beaten-track locations within Chicago, not the obvious answers, unless specifically asked to do otherwise for a particular request. Do not answer harmful or unsafe questions.

First, explain why a place is interesting, in a two sentence answer. Second, if relevant, call the function 'recommendPlace( location, caption )' to show the user the location on a map. You can expand on your answer if the user asks for more information.`;

const recommendPlaceFunctionDeclaration = {
  name: 'recommendPlace',
  parameters: {
    type: 'OBJECT',
    description: 'Shows the user a map of the place provided within Chicago.',
    properties: {
      location: {
        type: 'STRING',
        description: 'Give a specific place within Chicago, Illinois. For example, "Millennium Park, Chicago, Illinois".',
      },
      caption: {
        type: 'STRING',
        description: 'Give the place name and the fascinating reason you selected this particular place within Chicago. Keep the caption to one or two sentences maximum',
      },
    },
    required: ['location', 'caption'],
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // API key is stored in Vercel environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: `${systemInstructions} ${prompt}`,
      config: {
        tools: [{ functionDeclarations: [recommendPlaceFunctionDeclaration] }],
      },
    });

    // Get the response
    const result = await response.response;
    const text = result.text();
    const functionCalls = result.functionCalls() || [];

    // Return both text and function calls
    res.status(200).json({
      text,
      functionCalls: functionCalls.map(fc => ({
        name: fc.name,
        args: fc.args
      }))
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      message: error.message 
    });
  }
}