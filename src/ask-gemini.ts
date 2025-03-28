import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from './system-instruction';
import { getPrompt } from './prompt';
import { nl2br, getAPIKey } from './utils';


export async function getResult(company: string, position: string, job: string, language: string, words: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-01-21",
    systemInstruction: getSystemInstruction(company, job, words, language)
  });
  const prompt = getPrompt(language, company, position,words);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}

