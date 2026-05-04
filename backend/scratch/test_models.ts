import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY is missing');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // There is no direct listModels in the client SDK like this, 
    // but we can try to hit the discovery endpoint or just try different names.
    // Actually, let's try 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent('Hi');
    console.log('Success with gemini-1.5-flash-latest:', (await result.response).text());
  } catch (error) {
    console.error('Failed with gemini-1.5-flash-latest:', error.message);
  }
}

listModels();
