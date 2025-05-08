# Add a custom CV generation

The current codebase generates a cover letter for the submitted job advertisement.

I would like to add a custom CV generation feature that takes the job advertisement and the user's CV as input and generates a new CV tailored to the job advertisement.

The generated CV will be displayed in a card above the cover letter card.

I want this app to perform two prompts for the job advertisement: one for the CV and one for the cover letter.

Tell me the modifications to make to the codebase to achieve this.





# This is claude-3-7-sonnet-latest answer (3k in, 4k out)

# Adding Custom CV Generation Feature

I'll guide you through the necessary modifications to add a custom CV generation feature that tailors the user's CV based on the job advertisement. Here's what we need to change:

## 1. Update the EJS Template (views/index.ejs)

First, let's modify the index.ejs file to add a new section for the CV results:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <title>Job Posting Form</title>
  </head>
  <body>

    <div class="container">
      <h2 class="mt-4">CV Results</h2>
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Gemini CV
            </div>
            <div class="card-body" id="geminiCVResult">
              <%- geminiCV %> 
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI CV
            </div>
            <div class="card-body" id="openAICVResult">
              <%- openAICV %>
            </div>
          </div>
        </div>
      </div>

      <h2 class="mt-4">Cover Letter Results</h2>
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Gemini Cover Letter
            </div>
            <div class="card-body" id="geminiResult">
              <%- geminiMessage %> 
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI Cover Letter
            </div>
            <div class="card-body" id="openAIResult">
              <%- openAIMessage %>
            </div>
          </div>
        </div>
      </div>

      <h2 class="mt-4">Post a Job</h2>
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
          <label for="job" class="form-label">Job description</label>
          <textarea id="job" class="form-control" rows="15" name="job"></textarea>
        </div>
        <div class="mb-3">
          <label for="language" class="form-label">Language</label><br/>
          <input type="radio" id="languageen" name="language" value="English">
          <label for="language" class="form-label">English</label> 
          <input type="radio" id="languagefr" name="language" value="French">
          <label for="language" class="form-label">French</label>
        </div>
        <div class="mb-3">
          <label for="words-number" class="form-label">Number of words</label>
          <input type="number" class="form-control" id="words-number" placeholder="Enter number of words" name="words" value="100">
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>

  </body>
</html>
```

## 2. Create a new file for CV System Instructions (src/cv-system-instruction.ts)

Let's create a new file to hold system instructions for CV generation:

```typescript
import fs from 'fs';

export function getCVSystemInstruction(company: string, job: string, language: string): string {
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
    return '# Instructions \n\n'
      + 'Agis en tant qu\'expert en ressources humaines qui adapte des CV en fonction des offres d\'emploi. '
      + 'Tu vas optimiser le CV existant pour qu\'il corresponde parfaitement au poste décrit.\n\n' 
      + company_search_fr
      + 'Voici la description du poste convoité:\n\n"' + job + '".\n'
      + 'Le CV de base est le suivant:\n\n"' + cv_fr + '".\n'
      + 'Améliore ce CV en mettant en avant les compétences et expériences pertinentes pour ce poste spécifique. '
      + 'Réorganise les sections si nécessaire, ajoute des mots-clés pertinents et accentue les réalisations qui correspondent aux besoins du poste. '
      + 'Pour formatter ta réponse, n\'utilises pas Markdown, utilises simplement du texte brut.';
  }
  
  let system_instruction_en = ():string => { 
    return '# Instructions \n\n'
      + 'Act as a human resources expert who tailors resumes based on job postings. '
      + 'You will optimize the existing CV to perfectly match the described position.\n\n'
      + company_search_en
      + 'This is the job description:\n\n"'+ job + '".\n'
      + 'The base CV is as follows:\n\n"' + cv_en + '".\n'
      + 'Improve this CV by highlighting relevant skills and experiences for this specific position. '
      + 'Reorganize sections if necessary, add relevant keywords, and emphasize achievements that match the job requirements. '
      + 'For formatting your answer, do not use Markdown, just plain text.';
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

## 3. Create a new file for CV Prompts (src/cv-prompt.ts)

Now, let's create a file for CV-specific prompts:

```typescript
export function getCVPrompt(language: string, company: string, position: string): string {
  if (language === 'French') { 
    return 'Adapte mon CV pour une candidature au poste "' + position + '" dans la société "' + company + '". Organise le contenu de façon claire et professionnelle.';
  }
  if (language === 'English') {
    return 'Tailor my CV for an application to the "' + position + '" position at the "' + company + '" company. Organize the content in a clear and professional manner.';
  }
  return '';
}
```

## 4. Modify the Gemini Integration (src/ask-gemini.ts)

Update the Gemini integration to support CV generation:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstruction } from './system-instruction';
import { getCVSystemInstruction } from './cv-system-instruction';
import { getPrompt } from './prompt';
import { getCVPrompt } from './cv-prompt';
import { nl2br, getAPIKey } from './utils';

export async function getResult(company: string, position: string, job: string, language: string, words: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model : "gemini-2.5-pro-exp-03-25",
    systemInstruction: getSystemInstruction(company, job, words, language)
  });
  const prompt = getPrompt(language, company, position, words);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}

export async function getCVResult(company: string, position: string, job: string, language: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model : "gemini-2.5-pro-exp-03-25",
    systemInstruction: getCVSystemInstruction(company, job, language)
  });
  const prompt = getCVPrompt(language, company, position);
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}
```

## 5. Modify the OpenAI Integration (src/ask-openai.ts)

Update the OpenAI integration to support CV generation:

```typescript
import OpenAI from 'openai';
import { getPrompt } from './prompt';
import { getCVPrompt } from './cv-prompt';
import { getSystemInstruction } from './system-instruction';
import { getCVSystemInstruction } from './cv-system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

export async function getResult(company: string, position: string, job: string, language: string, words: string): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstruction(company, job, words, language)},
      {role: 'user', content: getPrompt(language, company, position, words)}
    ],
    model: 'gpt-4.5-preview'});
  return nl2br(nullToEmptyString(chatCompletion.choices[0].message.content));
}

export async function getCVResult(company: string, position: string, job: string, language: string): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getCVSystemInstruction(company, job, language)},
      {role: 'user', content: getCVPrompt(language, company, position)}
    ],
    model: 'gpt-4.5-preview'});
  return nl2br(nullToEmptyString(chatCompletion.choices[0].message.content));
}
```

## 6. Update the Main Express Application (src/index.ts)

Finally, let's update the main index.ts file to use our new CV generation functions:

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
import { getResult as getOpenAIResult, getCVResult as getOpenAICVResult } from './ask-openai';
import { getResult as getGeminiResult, getCVResult as getGeminiCVResult } from './ask-gemini';
import { getAuthToken } from './utils';

const app = express();
const port = process.env.PORT || 3000; // Allow port configuration via environment variable

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.render('index', { 
    geminiMessage: "Waiting for your question", 
    openAIMessage: "Waiting for your question",
    geminiCV: "Waiting for your question",
    openAICV: "Waiting for your question"
  });
});

app.post('/', async (req: Request, res: Response) => {
  const { company, job, language, position, words, token } = req.body;

  if (!company || !position || !job || !language || !words || !token) {
    return res.render('index', { 
      geminiMessage: "Missing required fields", 
      openAIMessage: "Missing required fields",
      geminiCV: "Missing required fields",
      openAICV: "Missing required fields"
    });
  }

  if (token !== getAuthToken()) {
    return res.render('index', { 
      geminiMessage: "Invalid token", 
      openAIMessage: "Invalid token",
      geminiCV: "Invalid token",
      openAICV: "Invalid token"
    }); 
  }

  try {
    // Generate cover letters
    const geminiCoverLetterPromise = getGeminiResult(company, position, job, language, words);
    const openAICoverLetterPromise = getOpenAIResult(company, position, job, language, words);
    
    // Generate CVs
    const geminiCVPromise = getGeminiCVResult(company, position, job, language);
    const openAICVPromise = getOpenAICVResult(company, position, job, language);
    
    // Wait for all promises to resolve
    const [geminiCoverLetter, openAICoverLetter, geminiCV, openAICV] = await Promise.all([
      geminiCoverLetterPromise,
      openAICoverLetterPromise,
      geminiCVPromise,
      openAICVPromise
    ]);

    res.render('index', { 
      geminiMessage: geminiCoverLetter, 
      openAIMessage: openAICoverLetter,
      geminiCV: geminiCV,
      openAICV: openAICV
    });
  } catch (error) {
    console.error("Error processing request:", error); // Log errors for debugging
    res.status(500).render('index', { 
      geminiMessage: "An error occurred", 
      openAIMessage: "An error occurred",
      geminiCV: "An error occurred",
      openAICV: "An error occurred"
    }); 
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
```

## Summary of Changes

Here's a summary of all the modifications we made:

1. **Updated views/index.ejs** to add new CV result cards above the cover letter result cards
2. **Created src/cv-system-instruction.ts** with system instructions for CV generation
3. **Created src/cv-prompt.ts** with prompts for CV generation
4. **Updated src/ask-gemini.ts** to add a new function for CV generation
5. **Updated src/ask-openai.ts** to add a new function for CV generation
6. **Updated src/index.ts** to:
   - Initialize new CV result variables
   - Call the CV generation functions
   - Use Promise.all to await all generation functions
   - Pass CV results to the template

These changes will add a custom CV generation feature to your application, which will display tailored CVs above the cover letters in your web interface.

