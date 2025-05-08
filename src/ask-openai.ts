import OpenAI from 'openai';
import { getPromptCoverLetter, getPromptCV } from './prompt'; // Updated import
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction'; // Updated import
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

// Renamed from getResult to be specific to Cover Letters
export async function getOpenAICoverLetterResult(company: string, position: string, job: string, language: string, words: string ): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCoverLetter(company, job, words, language)}, // Use specific system instruction
      {role: 'user', content: getPromptCoverLetter(language, company, position, words)} // Use specific prompt
    ],
    model: 'gpt-4.5-preview'}); // Consider using a newer model if available, like gpt-4o
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

// New function for OpenAI CV Generation
export async function getOpenAICVResult(jobDescription: string, position: string, language: string): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCV(jobDescription, language)}, // Use CV system instruction
      {role: 'user', content: getPromptCV(language, jobDescription, position)} // Use CV prompt
    ],
    model: 'gpt-4.5-preview'}); // Consider using a newer model if available, like gpt-4o
  return nullToEmptyString(chatCompletion.choices[0].message.content);
}

