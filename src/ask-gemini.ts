import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from './system-instruction';
import { getPrompt } from './prompt';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';


export async function getResult(company: string, position: string, job: string, language: string, chars: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    systemInstruction: getSystemInstruction(company, job, chars, language)
  });
  const prompt = getPrompt(language, company, position,chars);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}

