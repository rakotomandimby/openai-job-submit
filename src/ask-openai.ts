import OpenAI from 'openai';
import fs from 'fs';

function nullToEmptyString(str: string | null): string {
  if (str === null) { return "";}
  else { return str;}
}


function nl2br(str: string): string {
  return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
}
 
async function main() { }

export  async function getResult(company: string, position: string, job: string, language: string) {
  const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"]
  });
  console.log("Current directory: " + __dirname);

  const cv_en = fs.readFileSync('./src/cv-en.txt', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.txt', 'utf8');  
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'Given a job description and a CV, act as an assistant that helps to write a resume that will be valuable to get a job.'
          + 'Grab what you have about the company "'+company+'",'
          + 'and write a cover letter with words that are meaningfull to human resource staff. '
          + 'You are given the CV in two languages, english and french. '
          + 'You are also given a job description in english:\n"'+job+'".\n'
          + 'The CV in english is the following:\n"' + cv_en + '".\n'
          + 'The same CV in french is the following:\n"' + cv_fr + '".\n'
          + 'You will talk at the first person, as if you were the candidate.'
      },
      {
        role: 'user',
        content: 'Write an '+language+' cover letter for the position "'+position+'" at the company "'+company+'".'
          + 'Start it with a paragraph talking about public known information of '+ company +' IT orientation and recruitments.\n',
      }
    ],
    model: 'gpt-4-1106-preview',
  });
  
  console.log(chatCompletion.choices[0].message.content);
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

