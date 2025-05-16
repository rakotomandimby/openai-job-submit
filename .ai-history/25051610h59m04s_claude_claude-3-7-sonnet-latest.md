# Option to not search about the target enterprise 

The user generally knows the target enterprise.
But when the job advertisement is made by a headhunter, the user may not know the target enterprise.

Therefore, the user should be able to choose if he wants to search about the target enterprise or not.

Propose me the changes to make to the user interface and the harcoded prompts in order to handle this option.



# This is claude-3-7-sonnet-latest answer (6k in, 3k out)

# Implementing "Don't Search About Company" Option

I'll implement changes to the UI and prompts to allow users to choose whether to search about the target enterprise or not. This will be helpful when applying through headhunters where the company isn't disclosed.

## Changes to `./views/index.ejs`

Add a checkbox in the form to toggle company search:

```html
<!DOCTYPE html>
<html>
  <!-- head remains the same -->
  <body>
    <div class="container">
      <!-- No changes to results section -->

      <h2 class="mt-4">Generate Documents</h2>
      <form class="mt-4" action="/" method="POST">
        <div class="mb-3">
          <label for="token" class="form-label">Token</label>
          <input type="text" class="form-control" id="token" placeholder="Enter token" name="token" >
        </div>
        <div class="mb-3">
          <label for="company" class="form-label">Company name</label>
          <input type="text" class="form-control" id="company" placeholder="Enter company name" name="company" >
          
          <!-- New checkbox for company search option -->
          <div class="form-check mt-2">
            <input class="form-check-input" type="checkbox" id="skipCompanySearch" name="skipCompanySearch">
            <label class="form-check-label" for="skipCompanySearch">
              Skip company research (use for headhunter job ads where company is unknown)
            </label>
          </div>
        </div>
        <!-- Rest of the form remains the same -->
      </form>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
  </body>
</html>
```

## Changes to `./src/index.ts`

Update the POST handler to process the new checkbox:

```typescript
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
    const geminiCV = await getGeminiCVResult(job, position, language);
    const openAICV = await getOpenAICVResult(job, position, language);

    // Generate Cover Letters - pass the skipCompanySearch flag
    const searchCompany = skipCompanySearch !== 'on';
    const geminiCoverLetter = await getGeminiCoverLetterResult(company, position, job, language, words, searchCompany);
    const openAICoverLetter = await getOpenAICoverLetterResult(company, position, job, language, words, searchCompany);

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
```

## Changes to `./src/system-instruction.ts`

Update the system instruction function to handle the skip company search option:

```typescript
import fs from 'fs';

// Update function to accept searchCompany parameter
export function getSystemInstructionCoverLetter(company: string, job: string, words: string, language: string, searchCompany: boolean = true): string {
  const cv_en = fs.readFileSync('./src/cv-en.md', 'utf8');
  const cv_fr = fs.readFileSync('./src/cv-fr.md', 'utf8');
  let company_search_fr = '';
  let company_search_en = '';

  // Only add company search instructions if searchCompany is true and company isn't Unknown
  if(searchCompany && company !== 'Unknown'){
    company_search_fr = 'Prends ce que tu sais sur la société "' + company + '".';
    company_search_en = 'Grab what you have about the company "' + company + '".';
  } else {
    company_search_fr = '';
    company_search_en = '';
  }

  let system_instruction_fr = ():string => {
    return '# Instructions pour Lettre de Motivation\n\n'
      + 'Agis en tant que chercheur d\'emploi qui veut rédiger une lettre de motivation qui sera utile pour obtenir un emploi. '
      + 'et écris une lettre de motivation de ' + words + ' mots avec des mots qui sont significatifs pour un responsable des ressources humaines.\n\n'
      + company_search_fr
      + 'Voici la description du poste convoité:\n\n"' + job + '".\n'
      + 'Le CV de base du candidat est le suivant:\n\n"' + cv_fr + '".\n' 
      + 'Parles à la première personne, tu es le candidat. Pour formatter ta réponse, n\'utilises pas Markdown, utilises simplement du texte brut.';}
      
  let system_instruction_en = ():string => {
    return '# Cover Letter Instructions\n\n'
      + 'Act as a job seeker who needs to write a cover letter that will be valuable to get a job. '
      + company_search_en
      + 'and write a '+ words +' words cover letter with words that are meaningful to human resource staff.\n\n'
      + 'This is the job description:\n\n"'+ job + '".\n'
      + 'The candidate\'s base CV is as follows:\n\n"' + cv_en + '".\n'
      + 'You will talk in the first person, as you are the candidate. For formatting your answer, do not use Markdown, just plain text.';}

  if (language === 'French') {
    return system_instruction_fr();
  }
  if (language === 'English') {
    return system_instruction_en();
  }
  return '';
}

// No changes needed for getSystemInstructionCV function
export function getSystemInstructionCV(jobDescription: string, language: string): string {
  // Existing implementation...
}
```

## Changes to `./src/ask-gemini.ts`

Update function signatures to include the searchCompany parameter:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction';
import { getPromptCoverLetter, getPromptCV } from './prompt';
import { nl2br, getAPIKey } from './utils';

// Updated function signature to include searchCompany
export async function getGeminiCoverLetterResult(
  company: string, 
  position: string, 
  job: string, 
  language: string, 
  words: string,
  searchCompany: boolean = true
): Promise<string> {
  const genAI = new GoogleGenerativeAI(getAPIKey("gemini"));
  const model = genAI.getGenerativeModel({
    model : "gemini-1.5-pro-latest",
    systemInstruction: getSystemInstructionCoverLetter(company, job, words, language, searchCompany) // Pass searchCompany
  });
  const prompt = getPromptCoverLetter(language, company, position, words, searchCompany); // Pass searchCompany
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return nl2br(text);
}

// No changes needed for getGeminiCVResult function
export async function getGeminiCVResult(jobDescription: string, position: string, language: string): Promise<string> {
  // Existing implementation...
}
```

## Changes to `./src/ask-openai.ts`

Update function signatures to include the searchCompany parameter:

```typescript
import OpenAI from 'openai';
import { getPromptCoverLetter, getPromptCV } from './prompt';
import { getSystemInstructionCoverLetter, getSystemInstructionCV } from './system-instruction';
import { nl2br, nullToEmptyString, getAPIKey } from './utils';

// Updated function signature to include searchCompany
export async function getOpenAICoverLetterResult(
  company: string, 
  position: string, 
  job: string, 
  language: string, 
  words: string,
  searchCompany: boolean = true
): Promise<string> {
  const openai = new OpenAI({apiKey: getAPIKey("openai")});
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {role: 'system', content: getSystemInstructionCoverLetter(company, job, words, language, searchCompany)}, // Pass searchCompany
      {role: 'user', content: getPromptCoverLetter(language, company, position, words, searchCompany)} // Pass searchCompany
    ],
    model: 'gpt-4.5-preview'});
  return nl2br(nullToEmptyString(chatCompletion.choices[0].message.content));
}

// No changes needed for getOpenAICVResult function
export async function getOpenAICVResult(jobDescription: string, position: string, language: string): Promise<string> {
  // Existing implementation...
}
```

## Changes to `./src/prompt.ts`

Update prompt functions to handle the searchCompany parameter:

```typescript
// Update function to accept searchCompany parameter
export function getPromptCoverLetter(
  language: string, 
  company: string, 
  position: string, 
  words: string,
  searchCompany: boolean = true
): string {
  let companyPhrase;
  
  if (searchCompany) {
    companyPhrase = language === 'French' 
      ? `dans la société "${company}"` 
      : `at the "${company}" company`;
  } else {
    // Omit company name if we're skipping company search
    companyPhrase = language === 'French'
      ? "pour cette offre d'emploi" 
      : "for this job opportunity";
  }
  
  if (language === 'French') {
    return `Écris une lettre de motivation de ${words} mots pour postuler au poste "${position}" ${companyPhrase}.`;
  }
  if (language === 'English') {
    return `Write a ${words} words cover letter to apply for the "${position}" position ${companyPhrase}.`;
  }
  return '';
}

// No changes needed for getPromptCV function
export function getPromptCV(language: string, jobDescription: string, position: string): string {
  // Existing implementation...
}
```

These changes allow users to choose whether they want the AI to search for information about the target company, which is useful when applying through headhunters where the company name might be unknown or irrelevant for the initial application.

