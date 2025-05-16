# Option to not search about the target enterprise 

The user generally knows the target enterprise.
But when the job advertisement is made by a headhunter, the user may not know the target enterprise.

Therefore, the user should be able to choose if he wants to search about the target enterprise or not.

Propose me the changes to make to the user interface and the harcoded prompts in order to handle this option.



# This is claude-3-7-sonnet-latest answer (6k in, 4k out)

# Adding Option to Skip Company Search in Cover Letter Generation

To implement this feature, we need to make changes to both the user interface and the prompt handling code. Here's my proposed implementation:

## 1. First, let's modify the HTML form in `./views/index.ejs`

Add a checkbox after the company name field:

```html
<div class="mb-3">
  <label for="company" class="form-label">Company name</label>
  <input type="text" class="form-control" id="company" placeholder="Enter company name" name="company">
  <div class="form-check mt-2">
    <input class="form-check-input" type="checkbox" id="skipCompanySearch" name="skipCompanySearch">
    <label class="form-check-label" for="skipCompanySearch">
      Skip company research (use if company is unknown or not relevant)
    </label>
  </div>
</div>
```

## 2. Update the `./src/index.ts` file to handle the new checkbox

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
  const { company, job, language, position, words, token, skipCompanySearch } = req.body;

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
    // Pass skipCompanySearch boolean to the cover letter generation functions
    const shouldSkipCompanySearch = skipCompanySearch === 'on';
    const geminiCoverLetter = await getGeminiCoverLetterResult(company, position, job, language, words, shouldSkipCompanySearch);
    const openAICoverLetter = await getOpenAICoverLetterResult(company, position, job, language, words, shouldSkipCompanySearch);

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

## 3. Update the system instruction in `./src/system-instruction.ts`

```typescript
import fs from 'fs';

// Renamed from getSystemInstruction to be specific to Cover Letters
export function getSystemInstructionCoverLetter(company: string, job: string, words: string, language: string, skipCompanySearch: boolean = false): string {
  const cv_en = fs.readFileSync('./src/cv-en.md', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.md', 'utf8');
  let company_search_fr = '';
  let company_search_en = '';

  // Only include company research instructions if not skipping company search
  if (!skipCompanySearch && company !== 'Unknown') {
    company_search_fr = 'Prends ce que tu sais sur la société "' + company + '".';
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

## 4. Update `./src/ask-gemini.ts` to handle the new parameter

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction';
import { getPromptCoverLetter, getPromptCV } from './prompt';
import { nl2br, getAPIKey } from './utils';

export async function getGeminiCoverLetterResult(company: string, position: string, job: string, language: string, words: string, skipCompanySearch: boolean = false): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model : "gemini-2.5-pro-preview-05-06",
    systemInstruction: getSystemInstructionCoverLetter(company, job, words, language, skipCompanySearch)
  });
  const prompt = getPromptCoverLetter(language, company, position, words, skipCompanySearch);
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

## 5. Update `./src/ask-openai.ts` similarly

```typescript
import OpenAI from 'openai';
import { getPromptCoverLetter, getPromptCV } from './prompt';
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

export async function getOpenAICoverLetterResult(company: string, position: string, job: string, language: string, words: string, skipCompanySearch: boolean = false): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCoverLetter(company, job, words, language, skipCompanySearch)},
      {role: 'user', content: getPromptCoverLetter(language, company, position, words, skipCompanySearch)}
    ],
    model: 'gpt-4.5-preview'});
  return nl2br(nullToEmptyString(chatCompletion.choices[0].message.content));
}

export async function getOpenAICVResult(jobDescription: string, position: string, language: string): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCV(jobDescription, language)},
      {role: 'user', content: getPromptCV(language, jobDescription, position)}
    ],
    model: 'gpt-4.5-preview'});
  return nullToEmptyString(chatCompletion.choices[0].message.content);
}
```

## 6. Finally, update the `./src/prompt.ts` to include the skipCompanySearch parameter

```typescript
export function getPromptCoverLetter(language: string, company: string, position: string, words: string, skipCompanySearch: boolean = false): string {
  // If skipping company search, we might want to adjust the prompt slightly
  const companyPhrase = skipCompanySearch ? 
    "pour cette offre d'emploi" : 
    'dans la société "' + company + '"';
  
  const companyPhraseEn = skipCompanySearch ? 
    "for this job posting" : 
    'at the "' + company + '" company';

  if (language === 'French') {
    return 'Écris une lettre de motivation de ' + words + ' mots pour postuler au poste "' + position + '" ' + companyPhrase + '.';
  }
  if (language === 'English') {
    return 'Write a ' + words + ' words cover letter to apply for the "' + position + '" position ' + companyPhraseEn + '.';
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

With these changes, users can now opt to skip company research when generating cover letters, which is useful for situations where the hiring company is unknown (e.g., when applying through a headhunter) or when company-specific customization isn't relevant.

