import OpenAI from 'openai';
import { getPrompt } from './prompt';
import { getSystemInstruction } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

export  async function getResult(company: string, position: string, job: string, language: string, words: string ): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstruction(company, job, words, language)},
      {role: 'user', content: getPrompt(language, company, position, words)}
    ],
    model: 'gpt-4o'});
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

