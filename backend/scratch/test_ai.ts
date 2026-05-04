import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key exists:', !!apiKey);

if (!apiKey) {
  console.error('GEMINI_API_KEY is missing');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
    const result = await model.generateContent('Hello');
    const response = await result.response;
    console.log('Response:', response.text());
  } catch (error) {
    console.error('Test Error:', error);
  }
}

test();
