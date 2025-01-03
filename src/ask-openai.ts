import OpenAI from 'openai';
import { getPrompt } from './prompt';
import { getSystemInstruction } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';
import { getHrConversation } from './hr-conversation';

export  async function getResult(company: string, position: string, job: string, language: string, chars: string ): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});

  let history: any[] = [];
  history.push({role: "system", content: getSystemInstruction(company, job, chars, language)});
  let hrConversation = await hRConversationToChatHistory("french");
  hrConversation.forEach((message) => {
    history.push(message);
  });
  history.push({role: "assistant", content: "Comment puis-je t'aider?"});

  const chatCompletion = await openai.chat.completions.create({
    messages: history,
    model: 'chatgpt-4o-latest'});
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

async function hRConversationToChatHistory(lang: string): Promise<any[]> {
  const messages = await getHrConversation(lang);
  let chatHistory:any[] = [];
  messages.forEach((message) => {
    chatHistory.push({role: "assistant", content: message.question});
    chatHistory.push({role: "user"     , content: message.answer});
  });
  return chatHistory;
}

