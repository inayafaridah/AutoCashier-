import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY is not defined in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateAIInsight(prompt: string, context?: any) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `
        Context data: ${JSON.stringify(context)}
        
        User Question: ${prompt}
        
        Please provide a professional, data-driven analysis based on the context provided. 
        If the context is empty, provide a general strategic business insight.
        Use markdown for formatting. Keep it concise but insightful.
      `;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return { ok: true, text: response.text() };
  } catch (error: any) {
    console.error('AI Insight Error:', error);
    return { ok: false, error: error.message || 'Failed to generate AI insight' };
  }
}
