# Option to not search about the target enterprise 

The user generally knows the target enterprise.
But when the job advertisement is made by a headhunter, the user may not know the target enterprise.

Therefore, the user should be able to choose if he wants to search about the target enterprise or not.

Propose me the changes to make to the user interface and the harcoded prompts in order to handle this option.



# This is gemini-2.5-pro-preview-05-06 answer (5k in, 4k out)

Okay, I can help you with that. This feature will give users more control over the cover letter generation process, especially when the target company is unknown.

Here are the proposed changes:

## 1. Modify the User Interface (`./views/index.ejs`)

We'll add a checkbox to the form to allow users to specify if they want the system to try and use information about the company.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <title>Job Application Assistant</title> <!-- Changed title -->
  </head>
  <body>

    <div class="container">
      <h2 class="mt-4">Generated Documents</h2>

      <!-- New Row for CV Results -->
      <h3 class="mt-3">Tailored CVs</h3>
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Gemini CV Result
            </div>
            <div class="card-body" id="geminiCVResult" style="white-space: pre-wrap;"><!-- Added style for pre-wrap -->
              <%- geminiCVResult %>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI CV Result
            </div>
            <div class="card-body" id="openAICVResult" style="white-space: pre-wrap;"><!-- Added style for pre-wrap -->
              <%- openAICVResult %>
            </div>
          </div>
        </div>
      </div>

      <!-- Existing Row for Cover Letter Results -->
      <h3 class="mt-4">Cover Letters</h3> <!-- Added heading for clarity -->
      <div class="row mt-3"> <!-- Added margin-top -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Gemini Cover Letter Result <!-- Renamed for clarity -->
            </div>
            <div class="card-body" id="geminiCoverLetterResult" style="white-space: pre-wrap;"><!-- Changed ID, Added style for pre-wrap -->
              <%- geminiCoverLetterResult %>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI Cover Letter Result <!-- Renamed for clarity -->
            </div>
            <div class="card-body" id="openAICoverLetterResult" style="white-space: pre-wrap;"><!-- Changed ID, Added style for pre-wrap -->
              <%- openAICoverLetterResult %>
            </div>
          </div>
        </div>
      </div>

      <h2 class="mt-4">Generate Documents</h2> <!-- Changed heading -->
      <form class="mt-4" action="/" method="POST">
        <div class="mb-3">
          <label for="token" class="form-label">Token</label>
          <input type="text" class="form-control" id="token" placeholder="Enter token" name="token" >
        </div>
        <div class="mb-3">
          <label for="company" class="form-label">Company name</label>
          <input type="text" class="form-control" id="company" placeholder="Enter company name (or 'Unknown')" name="company" > <!-- Added hint for 'Unknown' -->
        </div>
        <!-- New Checkbox for searching company info -->
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="searchCompany" name="searchCompany" value="true" checked>
          <label class="form-check-label" for="searchCompany">Attempt to use specific information about the company (if name provided)</label>
        </div>
        <div class="mb-3">
          <label for="position" class="form-label">Position</label>
          <input type="text" class="form-control" id="position" placeholder="Enter position" name="position">
        </div>
        <div class="mb-3">
          <label for="job" class="form-label">Job description (will be used for CV and Cover Letter)</label> <!-- Clarified usage -->
          <textarea id="job" class="form-control" rows="15" name="job" placeholder="Paste the full job description here..."></textarea> <!-- Added placeholder -->
        </div>
        <div class="mb-3">
          <label for="language" class="form-label">Language</label><br/>
          <input type="radio" id="languageen" name="language" value="English" checked> <!-- Added checked by default -->
          <label for="languageen" class="form-label">English</label>
          <input type="radio" id="languagefr" name="language" value="French">
          <label for="languagefr" class="form-label">French</label>
        </div>
        <div class="mb-3">
          <label for="words-number" class="form-label">Number of words (for Cover Letter)</label> <!-- Clarified usage -->
          <input type="number" class="form-control" id="words-number" placeholder="Enter number of words for cover letter" name="words" value="100">
        </div>
        <button type="submit" class="btn btn-primary">Generate</button> <!-- Changed button text -->
      </form>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script> <!-- Added bootstrap JS for potential components -->
  </body>
</html>
```

## 2. Update Server-Side Logic (`./src/index.ts`)

We need to read the new checkbox value from the form submission and pass it to the cover letter generation functions.

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
// Updated imports for AI service functions
import { getOpenAICoverLetterResult, getOpenAICVResult } from './ask-openai';
import { getGeminiCoverLetterResult, getGeminiCVResult } from './ask-gemini';
import { getAuthToken } from './utils';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // Adjusted path assuming 'views' is sibling to 'src' after build
app.use(express.static('public'));

app.get('/', (req: Request, res: Response) => {
  res.render('index', {
    geminiCVResult: "Waiting for your job description for CV generation", // New placeholder
    openAICVResult: "Waiting for your job description for CV generation", // New placeholder
    geminiCoverLetterResult: "Waiting for your question for Cover Letter", // Renamed for clarity
    openAICoverLetterResult: "Waiting for your question for Cover Letter"  // Renamed for clarity
  });
});

app.post('/', async (req: Request, res: Response) => {
  const { company, job, language, position, words, token } = req.body;
  // A checkbox sends its value if checked, otherwise it's not part of req.body
  const searchCompanyInfo = req.body.searchCompany === 'true';

  // 'job' is the job description text
  if (!company || !job || !language || !position || !words || !token) {
    return res.render('index', {
      geminiCVResult: "Missing required fields for CV",
      openAICVResult: "Missing required fields for CV",
      geminiCoverLetterResult: "Missing required fields for Cover Letter",
      openAICoverLetterResult: "Missing required fields for Cover Letter"
    });
  }

  if (token !== getAuthToken()) {
    return res.render('index', {
      geminiCVResult: "Invalid token",
      openAICVResult: "Invalid token",
      geminiCoverLetterResult: "Invalid token",
      openAICoverLetterResult: "Invalid token"
    });
  }

  try {
    // Generate CVs
    // The 'job' field from the form (job description) is the primary input for CV generation.
    // 'position' is also passed for context in the prompt.
    const geminiCV = await getGeminiCVResult(job, position, language);
    const openAICV = await getOpenAICVResult(job, position, language);

    // Generate Cover Letters
    // 'company', 'position', 'job' (description), 'language', 'words', and the new 'searchCompanyInfo' are used for cover letter.
    const geminiCoverLetter = await getGeminiCoverLetterResult(company, position, job, language, words, searchCompanyInfo);
    const openAICoverLetter = await getOpenAICoverLetterResult(company, position, job, language, words, searchCompanyInfo);

    res.render('index', {
      geminiCVResult: geminiCV,
      openAICVResult: openAICV,
      geminiCoverLetterResult: geminiCoverLetter,
      openAICoverLetterResult: openAICoverLetter
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).render('index', {
      geminiCVResult: "An error occurred during CV generation",
      openAICVResult: "An error occurred during CV generation",
      geminiCoverLetterResult: "An error occurred during Cover Letter generation",
      openAICoverLetterResult: "An error occurred during Cover Letter generation"
    });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
```

## 3. Update AI Service Calls

### `./src/ask-gemini.ts`

Modify `getGeminiCoverLetterResult` to accept and pass the `searchCompanyInfo` flag.

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction';
import { getPromptCoverLetter, getPromptCV } from './prompt';
import { nl2br, getAPIKey } from './utils';

export async function getGeminiCoverLetterResult(company: string, position: string, job: string, language: string, words: string, searchCompanyInfo: boolean): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model : "gemini-2.5-pro-preview-05-06",
    systemInstruction: getSystemInstructionCoverLetter(company, job, words, language, searchCompanyInfo) // Pass searchCompanyInfo
  });
  const prompt = getPromptCoverLetter(language, company, position, words);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}

export async function getGeminiCVResult(jobDescription: string, position: string, language: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro-preview-05-06",
    systemInstruction: getSystemInstructionCV(jobDescription, language)
  });
  const prompt = getPromptCV(language, jobDescription, position);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}
```

### `./src/ask-openai.ts`

Modify `getOpenAICoverLetterResult` to accept and pass the `searchCompanyInfo` flag.

```typescript
import OpenAI from 'openai';
import { getPromptCoverLetter, getPromptCV } from './prompt';
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

export async function getOpenAICoverLetterResult(company: string, position: string, job: string, language: string, words: string, searchCompanyInfo: boolean ): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCoverLetter(company, job, words, language, searchCompanyInfo)}, // Pass searchCompanyInfo
      {role: 'user', content: getPromptCoverLetter(language, company, position, words)}
    ],
    model: 'gpt-4.5-preview'}); // Consider using a more up-to-date model if available/preferred, e.g., gpt-4-turbo-preview or gpt-4o
  return nl2br( nullToEmptyString(chatCompletion.choices[0].message.content));
}

export async function getOpenAICVResult(jobDescription: string, position: string, language: string): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCV(jobDescription, language)},
      {role: 'user', content: getPromptCV(language, jobDescription, position)}
    ],
    model: 'gpt-4.5-preview'}); // Consider using a more up-to-date model if available/preferred
  return nullToEmptyString(chatCompletion.choices[0].message.content);
}
```

## 4. Modify System Instructions (`./src/system-instruction.ts`)

Update `getSystemInstructionCoverLetter` to accept the new `searchCompanyInfo` boolean parameter and use it to conditionally include the company-specific instruction.

```typescript
import fs from 'fs';

// Renamed from getSystemInstruction to be specific to Cover Letters
// Added searchCompanyInfo parameter
export function getSystemInstructionCoverLetter(company: string, job: string, words: string, language: string, searchCompanyInfo: boolean): string {
  const cv_en = fs.readFileSync('./src/cv-en.md', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.md', 'utf8');
  let company_search_fr = '';
  let company_search_en = '';

  // Only include company search instruction if company is not "Unknown" AND searchCompanyInfo is true
  if(company !== 'Unknown' && searchCompanyInfo){
    company_search_fr = 'Prends ce que tu sais sur la société "' + company + '". '; // Added space at the end
  }

  if(company !== 'Unknown' && searchCompanyInfo){
    company_search_en = 'Grab what you have about the company "' + company + '". '; // Added space at the end
  }

  let system_instruction_fr = ():string => {
    return '# Instructions pour Lettre de Motivation\n\n'
      + 'Agis en tant que chercheur d\'emploi qui veut rédiger une lettre de motivation qui sera utile pour obtenir un emploi. '
      + company_search_fr // This will be empty if conditions are not met
      + 'et écris une lettre de motivation de ' + words + ' mots avec des mots qui sont significatifs pour un responsable des ressources humaines.\n\n'
      + 'Voici la description du poste convoité:\n\n"' + job + '".\n'
      + 'Le CV de base du candidat est le suivant:\n\n"' + cv_fr + '".\n'
      + 'Parles à la première personne, tu es le candidat. Pour formatter ta réponse, n\'utilises pas Markdown, utilises simplement du texte brut.';
  }
  let system_instruction_en = ():string => {
    return '# Cover Letter Instructions\n\n'
      + 'Act as a job seeker who needs to write a cover letter that will be valuable to get a job. '
      + company_search_en // This will be empty if conditions are not met
      + 'and write a '+ words +' words cover letter with words that are meaningful to human resource staff.\n\n'
      + 'This is the job description:\n\n"'+ job + '".\n'
      + 'The candidate\'s base CV is as follows:\n\n"' + cv_en + '".\n'
      + 'You will talk in the first person, as you are the candidate. For formatting your answer, do not use Markdown, just plain text.';
  }

  if (language === 'French') {
    return system_instruction_fr();
  }
  if (language === 'English') {
    return system_instruction_en();
  }
  return '';
}

// New function for CV System Instructions
export function getSystemInstructionCV(jobDescription: string, language: string): string {
  const cv_en_base = fs.readFileSync('./src/cv-en.md', 'utf8');
  const cv_fr_base = fs.readFileSync('./src/cv-fr.md', 'utf8');

  let system_instruction_fr = ():string => {
    return '# Instructions pour Génération de CV\n\n'
      + ' Tu es un expert en rédaction de CV. Ta tâche est de créer un CV sur mesure basé sur le CV de base fourni et la description de poste spécifique. \n'
      + ' Le CV doit mettre en évidence les compétences et expériences pertinentes du CV de base qui correspondent aux exigences du poste. \n'
      + ' Réorganise et reformule les sections du CV de base pour les aligner étroitement avec la description de poste. \n'
      + ' Assure-toi que le résultat est un CV complet, professionnel et optimisé pour le poste.\n\n'
      + ' Voici la description du poste pour lequel adapter le CV:\n\n"' + jobDescription + '".\n\n'
      + ' Voici le CV de base du candidat:\n\n"' + cv_fr_base + '".\n\n'
      + ' Le CV généré doit être formaté dans un fragment HTML sans balise HTML, ni balise HEAD, ni balise  TITLE, ni balise BODY, ni balise BR .'
      + ' Il ne faut mettre aucun élément Markdown dans la réponse.\n'
  }

  let system_instruction_en = ():string => {
    return '# CV Generation Instructions\n\n'
      + ' You are an expert CV writer. Your task is to create a tailored CV based on the provided base CV and the specific job description.\n'
      + ' The CV should highlight relevant skills and experiences from the base CV that match the job requirements.\n'
      + ' Reorganize and rephrase sections of the base CV to align closely with the job description.\n'
      + ' Ensure the output is a complete, professional CV optimized for the position.\n\n'
      + ' This is the job description to tailor the CV for:\n\n"' + jobDescription + '".\n\n'
      + ' This is the candidate\'s base CV:\n\n"' + cv_en_base + '".\n\n'
      + ' The generated CV should be formatted in an HTML fragment without the HTML tag , nor the HEAD tag , nor the TITLE tag , nor the BODY tag, nor the BR tag.'
      + ' Do not put any Markdown elements in the answer.\n';
  }

  if (language === 'French') {
    return system_instruction_fr();
  }
  if (language === 'English') {
    return system_instruction_en();
  }
  return '';
}
```

With these changes:
1.  The user will see a new checkbox in the form: "Attempt to use specific information about the company (if name provided)". It's checked by default.
2.  If the user unchecks it, or if the company name is "Unknown", the part of the prompt asking the AI to "Grab what you have about the company..." will be omitted.
3.  If the company name is provided and the checkbox is checked, the prompt will include the instruction to use company-specific knowledge.

This provides the flexibility you were looking for. Remember to rebuild your TypeScript project after applying these changes.
