import OpenAI from 'openai';
import fs from 'fs';
const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});

// chatCompletion.choices[0].message.content can be of type string or null.
// write a function that returns a "" if chatCompletion.choices[0].message.content is null, and returns chatCompletion.choices[0].message.content otherwise
function nullToEmptyString(str: string | null): string {
  if (str === null) {
    return "";
  } else {
    return str;
  }
}


async function main() {
  // put the content of the ./cv-en.txt file in the cv_en variable 
  const cv_en = fs.readFileSync('./cv-en.txt', 'utf8');
  // put the content of the ./cv-fr.txt file in the cv_fr variable
  const cv_fr = fs.readFileSync('./cv-fr.txt', 'utf8');

  // put the content of the ./job.txt file in the job variable
  const job = fs.readFileSync('./job.txt', 'utf8');

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      // tell chatbot he has the assistant role
      {
        role: 'system',
        content: 'Given a job description and a CV, you are an assistant that helps to pick the 3 most relevant held positions that will be valuable to get the job.'
          +'You will summarize those relevant positions from the CV, with words that talk to human resource staff.\n'
          +' You are given a CV in two languages, english and french. You are also given a job description in english.\n'
          + 'The CV in english is the following:\n"' + cv_en + '"\n'
          + 'The CV in french is the following:\n"' + cv_fr + '"\n'
          + 'You will talk at the first person, as if you were the candidate.'
      },
      {
        role: 'user',
        content: 'Pick the 3 most relevant held positions that will be valuable to get the job, '
          + 'and write a 3 paragraphs summary of about 175 caracters each in french \n.'
          +' This is the job description:\n"' + job + '"',
      }
    ],
    model: 'gpt-4-1106-preview',
  });
  
  console.log(chatCompletion.choices[0].message.content);

  
  // write the result in the ./cv-fr.txt file
  fs.writeFileSync('./summary.txt', nullToEmptyString(chatCompletion.choices[0].message.content));
}

main();
