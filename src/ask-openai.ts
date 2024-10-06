import OpenAI from 'openai';
import { getPrompt } from './prompt';
import { getSystemInstruction } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

export  async function getResult(company: string, position: string, job: string, language: string, chars: string ): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system'   , content: getSystemInstruction(company, job, chars, language)},
      {role: 'user'     , content: "What is the word?"},
      {role: 'assistant', content: "Tell me the first letter of the word."},
      {role: 'user'     , content: "The first letter is 'c'."},
      {role: 'assistant', content: "Tell me the second letter of the word."},
      {role: 'user'     , content: "The second letter is 'a'."},
      {role: 'assistant', content: "Tell me the third letter of the word."},
      {role: 'user'     , content: "The third letter is 't'."},
      {role: 'assistant', content: "Tell me the next letter of the word."},
      {role: 'user'     , content: "There nis no more letters. What is the word?"}
    ],
    model: 'chatgpt-4o-latest'});
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

