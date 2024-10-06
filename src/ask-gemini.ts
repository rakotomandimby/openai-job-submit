import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from './system-instruction';
import { getPrompt } from './prompt';
import { nl2br, getAPIKey } from './utils';


export async function getResult(company: string, position: string, job: string, language: string, chars: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    systemInstruction: getSystemInstruction(company, job, chars, language),
  });
  //const prompt = getPrompt(language, company, position,chars);
  //const result = await model.generateContent(prompt);
  const startChatParams = {
    history: [
      {role: "user"  , parts: [{text: "What is the word?"}]},
      {role: "model", parts: [{text: "Tell me the first letter of the word."}]},
      {role: "user"  , parts: [{text: "The first letter is 'c'."}]},
      {role: "model", parts: [{text: "Tell me the second letter of the word."}]},
      {role: "user"  , parts: [{text: "The second letter is 'a'."}]},
      {role: "model", parts: [{text: "Tell me the third letter of the word."}]},
      {role: "user"  , parts: [{text: "The third letter is 't'."}]},
      {role: "model", parts: [{text: "Tell me the next letter of the word."}]},
    ]};
  const chat = model.startChat(startChatParams);
  const result = await chat.sendMessage("There is no more letters. What is the word?");
  const text = result.response.text();
  return nl2br(text);
}

