import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from './system-instruction';
import { getPrompt } from './prompt';
import { nl2br, getAPIKey } from './utils';
import { getHrConversation } from './hr-conversation';


export async function getResult(company: string, position: string, job: string, language: string, chars: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    systemInstruction: getSystemInstruction(company, job, chars, language),
  });
  //const prompt = getPrompt(language, company, position,chars);
  //const result = await model.generateContent(prompt);
  let history: ChatHistory[] = [];
  history.push({role: "user", parts: [{text: "Aide moi à écrire ma lettre de motivation."}]});
  let hrConversation = await hRConversationToChatHistory("french");
  hrConversation.forEach((message) => {
    history.push(message);
  });
  history.push({role: "model", parts: [{text: "Comment puis-je t'aider?"}]});

  const startChatParams = {history: history}; 
  // console.log("startChatParams", startChatParams); but expand nested objects
  console.log("startChatParams", JSON.stringify(startChatParams));
  const chat = model.startChat(startChatParams);
  const result = await chat.sendMessage("Ecris une lettre de motivation pour moi.");
  const text = result.response.text();
  return nl2br(text);
}

async function hRConversationToChatHistory(lang: string): Promise<ChatHistory[]> {
  const messages = await getHrConversation(lang);
  let chatHistory:ChatHistory[] = [];
  messages.forEach((message) => {
    chatHistory.push({role: "model", parts: [{text: message.question}]});
    chatHistory.push({role: "user", parts: [{text: message.answer}]});
  });
  return chatHistory;
}

interface ChatHistory {
  role: string;
  parts: {text: string}[];
}

