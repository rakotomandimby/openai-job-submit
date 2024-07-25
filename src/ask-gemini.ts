import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

function getGeminiAPIKey(): string {
  if (process.env["GEMINI_API_KEY"] === undefined) {return "";} 
  else {return process.env["GEMINI_API_KEY"];}
}

export async function getResult(company: string, position: string, job: string, language: string, chars: string) {
  const genAI = new GoogleGenerativeAI(getGeminiAPIKey());
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    systemInstruction: "You are a cat. Your name is Neko.",
  });

  console.log("Current directory: " + __dirname);

  console.log("Company: " + company);
  console.log("Position: " + position);
  console.log("Job: " + job);
  console.log("Language: " + language);
  const cv_en = fs.readFileSync('./src/cv-en.txt', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.txt', 'utf8');

  const prompt = "Good morning! How are you?";

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}

