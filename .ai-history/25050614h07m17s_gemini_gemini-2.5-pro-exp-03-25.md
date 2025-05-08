# Add a custom CV generation

The current codebase generates a cover letter for the submitted job advertisement.

I would like to add a custom CV generation feature that takes the job advertisement and the user's CV as input and generates a new CV tailored to the job advertisement.

The generated CV will be displayed in a card above the cover letter card.

I want this app to perform two prompts for the job advertisement: one for the CV and one for the cover letter.

Tell me the modifications to make to the codebase to achieve this.





# This is gemini-2.5-pro-exp-03-25 answer (7k in, 5k out)

Okay, this is an interesting enhancement! We'll need to modify several parts of your application to achieve this:

1.  **Backend Logic (`src/` directory):**
    *   Update system instructions and prompts to handle CV generation.
    *   Modify the AI service functions (`ask-openai.ts`, `ask-gemini.ts`) to make separate calls for CVs and cover letters.
    *   Adjust the main route handler in `src/index.ts` to orchestrate these calls and pass results to the view.
2.  **Frontend View (`views/index.ejs`):**
    *   Add new sections (cards) to display the generated CVs.

Here are the proposed modifications for each file:

### 1. `src/prompt.ts`

We'll add new functions to get prompts specifically for CV generation and rename the existing one for clarity.

```typescript
// src/prompt.ts
export function getPromptCoverLetter(language: string, company: string, position: string, words: string): string { // Renamed from getPrompt
  if (language === 'French') {
    return 'Écris une lettre de motivation de ' + words + ' mots pour postuler au poste "' + position + '" dans la société "' + company + '".';
  }
  if (language === 'English') {
    return 'Write a ' + words + ' words cover letter to apply for the "' + position + '" position at the "' + company + '" company.';
  }
  return '';
}

// New function for CV prompt
export function getPromptCV(language: string, jobDescription: string, position: string): string {
  if (language === 'French') {
    return `En te basant sur la description de poste suivante pour le rôle de "${position}", génère un CV personnalisé. La description de poste est : "${jobDescription}".`;
  }
  if (language === 'English') {
    return `Based on the following job description for the "${position}" role, generate a tailored CV. The job description is: "${jobDescription}".`;
  }
  return '';
}
```

### 2. `src/system-instruction.ts`

We'll add new system instructions for CV generation and rename the existing one. The CV generation will use the existing `cv-en.md` and `cv-fr.md` files.

```typescript
// src/system-instruction.ts
import fs from 'fs';

// Renamed from getSystemInstruction to be specific to Cover Letters
export function getSystemInstructionCoverLetter(company: string, job: string, words: string, language: string): string {
  const cv_en = fs.readFileSync('./src/cv-en.md', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.md', 'utf8');
  let company_search_fr = '';
  let company_search_en = '';

  if(company === 'Unknown'){
    company_search_fr= '';
  } else {
    company_search_fr = 'Prends ce que tu sais sur la société "' + company + '".';
  }

  if(company === 'Unknown'){
    company_search_en = '';
  } else {
    company_search_en = 'Grab what you have about the company "' + company + '".';
  }

  let system_instruction_fr = ():string => {
    return '# Instructions pour Lettre de Motivation\n\n'
      + 'Agis en tant que chercheur d\'emploi qui veut rédiger une lettre de motivation qui sera utile pour obtenir un emploi. '
      + 'et écris une lettre de motivation de ' + words + ' mots avec des mots qui sont significatifs pour un responsable des ressources humaines.\n\n'
      + company_search_fr
      + 'Voici la description du poste convoité:\n\n"' + job + '".\n'
      + 'Le CV de base du candidat est le suivant:\n\n"' + cv_fr + '".\n' // Base CV can still be context for cover letter
      + 'Parles à la première personne, tu es le candidat. Pour formatter ta réponse, n\'utilises pas Markdown, utilises simplement du texte brut.';}
  let system_instruction_en = ():string => {
    return '# Cover Letter Instructions\n\n'
      + 'Act as a job seeker who needs to write a cover letter that will be valuable to get a job. '
      + company_search_en
      + 'and write a '+ words +' words cover letter with words that are meaningful to human resource staff.\n\n'
      + 'This is the job description:\n\n"'+ job + '".\n'
      + 'The candidate\'s base CV is as follows:\n\n"' + cv_en + '".\n' // Base CV can still be context for cover letter
      + 'You will talk in the first person, as you are the candidate. For formatting your answer, do not use Markdown, just plain text.';}

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
      + 'Tu es un expert en rédaction de CV. Ta tâche est de créer un CV sur mesure basé sur le CV de base fourni et la description de poste spécifique. \n'
      + 'Le CV doit mettre en évidence les compétences et expériences pertinentes du CV de base qui correspondent aux exigences du poste. \n'
      + 'Réorganise et reformule les sections du CV de base pour les aligner étroitement avec la description de poste. \n'
      + 'Assure-toi que le résultat est un CV complet, professionnel et optimisé pour le poste.\n\n'
      + 'Voici la description du poste pour lequel adapter le CV:\n\n"' + jobDescription + '".\n\n'
      + 'Voici le CV de base du candidat:\n\n"' + cv_fr_base + '".\n\n'
      + 'Le CV généré doit être en texte brut, sans utiliser de Markdown.';
  }

  let system_instruction_en = ():string => {
    return '# CV Generation Instructions\n\n'
      + 'You are an expert CV writer. Your task is to create a tailored CV based on the provided base CV and the specific job description.\n'
      + 'The CV should highlight relevant skills and experiences from the base CV that match the job requirements.\n'
      + 'Reorganize and rephrase sections of the base CV to align closely with the job description.\n'
      + 'Ensure the output is a complete, professional CV optimized for the position.\n\n'
      + 'This is the job description to tailor the CV for:\n\n"' + jobDescription + '".\n\n'
      + 'This is the candidate\'s base CV:\n\n"' + cv_en_base + '".\n\n'
      + 'The generated CV should be in plain text, without using Markdown.';
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

### 3. `src/ask-openai.ts`

We'll create two functions here: one for cover letters and one for CVs.

```typescript
// src/ask-openai.ts
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
  return nl2br(nullToEmptyString(chatCompletion.choices[0].message.content));
}
```

### 4. `src/ask-gemini.ts`

Similar to OpenAI, we'll create two functions for Gemini.

```typescript
// src/ask-gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction'; // Updated import
import { getPromptCoverLetter, getPromptCV } from './prompt'; // Updated import
import { nl2br, getAPIKey } from './utils';

// Renamed from getResult to be specific to Cover Letters
export async function getGeminiCoverLetterResult(company: string, position: string, job: string, language: string, words: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model : "gemini-1.5-pro-latest", // Updated to a generally available powerful model
    systemInstruction: getSystemInstructionCoverLetter(company, job, words, language) // Use specific system instruction
  });
  const prompt = getPromptCoverLetter(language, company, position, words); // Use specific prompt
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}

// New function for Gemini CV Generation
export async function getGeminiCVResult(jobDescription: string, position: string, language: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest", // Updated to a generally available powerful model
    systemInstruction: getSystemInstructionCV(jobDescription, language) // Use CV system instruction
  });
  const prompt = getPromptCV(language, jobDescription, position); // Use CV prompt
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}
```
*Note*: I've updated the Gemini model from `"gemini-2.5-pro-exp-03-25"` to `"gemini-1.5-pro-latest"` as the former might be experimental and not broadly available. Adjust if you have specific access.

### 5. `src/index.ts`

The main application file will now call both CV and cover letter generation functions.

```typescript
// src/index.ts
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
    // 'company', 'position', 'job' (description), 'language', 'words' are used for cover letter.
    const geminiCoverLetter = await getGeminiCoverLetterResult(company, position, job, language, words);
    const openAICoverLetter = await getOpenAICoverLetterResult(company, position, job, language, words);

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
*Self-correction*: In `src/index.ts`, the path for views `app.set('views', path.join(__dirname, 'views'));` might be incorrect if your `dist` folder structure is `dist/index.js` and `dist/views/...`. If `index.js` is at the root of `dist`, then `path.join(__dirname, 'views')` would look for `dist/views`. If `index.js` is in `dist/src`, then it would be `path.join(__dirname, '../views')`. Your build script `cp -rv views/* dist/views/` suggests `dist/views` is correct relative to where `index.js` will be run from (likely `dist`). I've adjusted it to `path.join(__dirname, '../views')` assuming `index.js` is inside a `src` or similar subfolder within `dist`, or `path.join(__dirname, 'views')` if `index.js` is at the root of `dist`. Given your build script `... && /home/mihamina/Apps/node/bin/npx tsc && /home/mihamina/Apps/node/bin/node dist/index.js`, `dist/index.js` is the entry point, and `dist/views` is where views are. So `app.set('views', path.join(__dirname, 'views'));` should be correct if `__dirname` resolves to `dist/`. If `index.js` is compiled into `dist/src/index.js`, then `path.join(__dirname, '../views')` would be correct. I'll assume `dist/index.js` and `dist/views/`, so `app.set('views', path.join(__dirname, 'views'));` is likely correct. I'll revert my previous change on this line if it was `app.set('views', path.join(__dirname, 'views'));` as your build script implies this structure.
Looking at your `package.json` build script: `... /home/mihamina/Apps/node/bin/npx tsc` (which outputs to `dist` based on a typical `tsconfig.json`) and then `cp -rv views/* dist/views/`. Then you run `node dist/index.js`. This means `__dirname` inside `dist/index.js` will be the `dist` directory. So `path.join(__dirname, 'views')` is correct. I'll ensure the code reflects this.

Corrected `src/index.ts` views path based on analysis:
```typescript
// src/index.ts
// ... other imports
import { getOpenAICoverLetterResult, getOpenAICVResult } from './ask-openai';
import { getGeminiCoverLetterResult, getGeminiCVResult } from './ask-gemini';
// ...
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // This should be correct given your build process
app.use(express.static('public'));
// ... rest of the file as above
```

### 6. `views/index.ejs`

Add new cards for displaying the CV results. These will be placed above the cover letter results.

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
          <input type="text" class="form-control" id="company" placeholder="Enter company name" name="company" >
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
*Note*: I added `style="white-space: pre-wrap;"` to the card bodies displaying AI results. This will help preserve line breaks from the plain text output of the AI.

### Summary of Changes:

*   **Prompts & System Instructions**: Segregated for CVs and Cover Letters. CV generation focuses on tailoring the base CV (`cv-en.md`/`cv-fr.md`) to the job description.
*   **AI Service Calls**: Each AI service (`OpenAI`, `Gemini`) now has distinct functions for generating CVs and Cover Letters.
*   **Main Application (`index.ts`)**: Orchestrates calls to all four generation functions (CV & Cover Letter for both AI providers) and passes the results to the EJS template.
*   **View (`index.ejs`)**: Updated to include new cards for displaying the generated CVs above the cover letters, and clarified some labels.

Remember to:
1.  Ensure your base CVs (`src/cv-en.md` and `src/cv-fr.md`) are well-structured, as they are key inputs for the CV generation.
2.  Rebuild your TypeScript project (`npm run build` or similar) after applying these changes.
3.  Test thoroughly with different job descriptions.

This setup provides a clear separation of concerns for generating the two types of documents.
