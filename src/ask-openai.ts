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

export  async function getResult(company: string, position: string, job: string, language: string, chars: string) {
  const openai = new OpenAI({
    apiKey: process.env["OPENAI_API_KEY"]
  });
  console.log("Current directory: " + __dirname);

  console.log("Company: " + company);
  console.log("Position: " + position);
  console.log("Job: " + job);
  console.log("Language: " + language);
  const cv_en = fs.readFileSync('./src/cv-en.txt', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.txt', 'utf8');

  if (language === 'French') { 
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Compte tenu d\'une description de poste et d\'un CV, agis en tant qu\'assistant qui aide à rédiger une lettre de motivation qui sera utile pour obtenir un emploi.'
            + 'Prends ce que tu sais sur la société "'+company+'"'
            + 'et écris une lettre de motivation avec limitée à '+chars+' caractères avec des mots qui sont significatifs pour le responsable de recrutements de la societé' + company + '. '
            + 'Voici la description de poste:\n"'+job+'".\n'
            + 'Le CV du candidat est le suivant:\n"' + cv_fr + '".\n'
            + 'Parles à la première personne, comme si tu étais le candidat.'
        },
        {
          role: 'user',
          content: 'Écris une lettre de motivation limintée à '+chars+' caratères en '+language+' pour postuler au poste "'+position+'" dans la société "'+company+'".'
        }
      ],
      model: 'gpt-4-turbo-preview',
    }
    );
    return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
  }

  if (language === 'English') {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Given a job description and a CV, act as an assistant that helps to write a cover letter that will be valuable to get a job.'
            + 'Grab what you have about the company "'+company+'"'
            + 'and write a less than '+chars+' characters cover letter with words that are meaningfull to human resource staff. '
            + 'This is the job description:\n"'+job+'".\n'
            + 'The CV is the following:\n"' + cv_en + '".\n'
            + 'You will talk at the first person, as if you were the candidate.'
        },
        {
          role: 'user',
          content: 'Write a less than '+chars+' caracters cover letter for the position "'+position+'" at the company "'+company+'".'
        }
      ],
      model: 'gpt-4-turbo-preview',
    });
    return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
  }  
}

