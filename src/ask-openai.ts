import OpenAI from 'openai';
import { getPrompt } from './prompt';
import { getSystemInstruction } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

export  async function getResult(company: string, position: string, job: string, language: string, chars: string ): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstruction(company, job, chars, language)},
      {role: 'user', content: getPrompt(language, company, position, chars)}
    ],
    model: 'gpt-4-turbo'});
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

