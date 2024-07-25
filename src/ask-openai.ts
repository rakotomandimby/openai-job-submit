import OpenAI from 'openai';
import { getPrompt } from './prompt';
import { getSystemInstruction } from './system-instruction';

function nullToEmptyString(str: string | null): string {
  if (str === null) { return "";}
  else { return str;}
}

function nl2br(str: string): string {
  return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

export  async function getResult(company: string, position: string, job: string, language: string, chars: string ): Promise<string> {
  const openai = new OpenAI({apiKey: process.env["OPENAI_API_KEY"]});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstruction(company, job, chars, language)},
      {role: 'user', content: getPrompt(language, company, position, chars)}
    ],
    model: 'gpt-4-turbo'});
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

