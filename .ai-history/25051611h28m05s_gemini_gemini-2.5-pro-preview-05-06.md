# Make the application display an error message if a required environment variable is not set 

I want to implement the feature that if an environment variable required by the backend is not set, the application should display an error message in a red box at the top of the home page.

Tell me the modifications to make to the code in order to achieve that.



# This is gemini-2.5-pro-preview-05-06 answer (6k in, 3k out)

Okay, I can help you implement that feature. This will involve checking for the required environment variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `AUTH_TOKEN`) at application startup. If any are missing, we'll store error messages and pass them to your EJS template to be displayed.

We'll need to modify three files:
1.  `./src/utils.ts`: To make `getAuthToken` more robust in how it signals a missing token.
2.  `./src/index.ts`: To perform the checks, collect error messages, and pass them to the view. Also, to handle the `AUTH_TOKEN` more securely in the POST request.
3.  `./views/index.ejs`: To display these error messages.

Here are the complete code snippets for the modified files:

### 1. Modify `./src/utils.ts`

We'll update `getAuthToken` to return `null` if the token isn't set or is empty. This makes it easier for the main application logic to determine if the crucial `AUTH_TOKEN` is properly configured.

```typescript
export function nullToEmptyString(str: string | null): string {
  if (str === null) { return "";}
  else { return str;}
}

export function nl2br(str: string): string {
  return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
}

export function getAPIKey(modelName:string): string {
  if (modelName === "openai") {
    if (process.env["OPENAI_API_KEY"] === undefined) {return "";}
    else {return process.env["OPENAI_API_KEY"];}
  }
  else if (modelName === "gemini") {
    if (process.env["GEMINI_API_KEY"] === undefined) {return "";}
    else {return process.env["GEMINI_API_KEY"];}
  }
  else {return "";}
}

// Modified getAuthToken to return null if not set or empty
export function getAuthToken(): string | null {
  const token = process.env["AUTH_TOKEN"];
  if (token === undefined || token === "") {
    // Log a warning on the server side for critical missing configuration
    console.warn("CRITICAL: AUTH_TOKEN environment variable is not set or is empty. Application security is compromised.");
    return null;
  }
  return token;
}
```

### 2. Modify `./src/index.ts`

This file will now check for environment variables at startup. An array `envErrors` will store any messages about missing variables. This array will be passed to the `index.ejs` template. The POST route will also be updated to handle the case where `AUTH_TOKEN` is not configured on the server.

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
import { getOpenAICoverLetterResult, getOpenAICVResult } from './ask-openai';
import { getGeminiCoverLetterResult, getGeminiCVResult } from './ask-gemini';
import { getAuthToken } from './utils'; // Signature of getAuthToken has changed

const app = express();
const port = process.env.PORT || 3000;

// --- Environment Variable Checks ---
const envErrors: string[] = [];

if (!process.env.OPENAI_API_KEY) {
  envErrors.push("OPENAI_API_KEY is not set. OpenAI features may not work.");
}
if (!process.env.GEMINI_API_KEY) {
  envErrors.push("GEMINI_API_KEY is not set. Gemini features may not work.");
}

const configuredAuthToken = getAuthToken(); // Get the configured AUTH_TOKEN once at startup
if (!configuredAuthToken) {
  // The getAuthToken function already logs a console warning.
  // This message is for the UI.
  envErrors.push("AUTH_TOKEN is not set or is empty. The application is insecure, and submissions will be blocked.");
}
// --- End Environment Variable Checks ---

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static('public'));

app.get('/', (req: Request, res: Response) => {
  res.render('index', {
    envErrors: envErrors, // Pass environment errors to the template
    geminiCVResult: "Waiting for your job description for CV generation",
    openAICVResult: "Waiting for your job description for CV generation",
    geminiCoverLetterResult: "Waiting for your question for Cover Letter",
    openAICoverLetterResult: "Waiting for your question for Cover Letter"
  });
});

app.post('/', async (req: Request, res: Response) => {
  const { company, job, language, position, words, token: submittedToken } = req.body;
  const searchCompanyInfo = req.body.searchCompany === 'true';

  const baseRenderOptions = {
    envErrors: envErrors, // Always pass envErrors
    geminiCVResult: "An error occurred or input was missing.",
    openAICVResult: "An error occurred or input was missing.",
    geminiCoverLetterResult: "An error occurred or input was missing.",
    openAICoverLetterResult: "An error occurred or input was missing."
  };

  if (!company || !job || !language || !position || !words || submittedToken === undefined) { // Check submittedToken presence
    return res.render('index', {
      ...baseRenderOptions,
      geminiCVResult: "Missing required fields for CV",
      openAICVResult: "Missing required fields for CV",
      geminiCoverLetterResult: "Missing required fields for Cover Letter",
      openAICoverLetterResult: "Missing required fields for Cover Letter"
    });
  }

  // Check if AUTH_TOKEN is configured on the server
  if (!configuredAuthToken) {
    return res.render('index', {
      ...baseRenderOptions,
      geminiCVResult: "Security Alert: Application AUTH_TOKEN is not configured. Submission rejected.",
      openAICVResult: "Security Alert: Application AUTH_TOKEN is not configured. Submission rejected.",
      geminiCoverLetterResult: "Security Alert: Application AUTH_TOKEN is not configured. Submission rejected.",
      openAICoverLetterResult: "Security Alert: Application AUTH_TOKEN is not configured. Submission rejected."
    });
  }

  if (submittedToken !== configuredAuthToken) {
    return res.render('index', {
      ...baseRenderOptions,
      geminiCVResult: "Invalid token",
      openAICVResult: "Invalid token",
      geminiCoverLetterResult: "Invalid token",
      openAICoverLetterResult: "Invalid token"
    });
  }

  try {
    const geminiCV = await getGeminiCVResult(job, position, language);
    const openAICV = await getOpenAICVResult(job, position, language);
    const geminiCoverLetter = await getGeminiCoverLetterResult(company, position, job, language, words, searchCompanyInfo);
    const openAICoverLetter = await getOpenAICoverLetterResult(company, position, job, language, words, searchCompanyInfo);

    res.render('index', {
      envErrors: envErrors,
      geminiCVResult: geminiCV,
      openAICVResult: openAICV,
      geminiCoverLetterResult: geminiCoverLetter,
      openAICoverLetterResult: openAICoverLetter
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).render('index', {
      ...baseRenderOptions, // Use base options for error display
      geminiCVResult: "An error occurred during CV generation",
      openAICVResult: "An error occurred during CV generation",
      geminiCoverLetterResult: "An error occurred during Cover Letter generation",
      openAICoverLetterResult: "An error occurred during Cover Letter generation"
    });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
  if (envErrors.length > 0) {
    console.warn("--- Configuration Issues Detected ---");
    envErrors.forEach(err => console.warn(`- ${err}`));
    console.warn("------------------------------------");
  }
});
```

### 3. Modify `./views/index.ejs`

Add a section at the top of this file to display the error messages if any exist. We'll use Bootstrap's alert component for styling.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <title>Job Application Assistant</title>
  </head>
  <body>

    <div class="container">

      <% if (typeof envErrors !== 'undefined' && envErrors.length > 0) { %>
        <div class="alert alert-danger mt-3" role="alert">
          <h4 class="alert-heading">Configuration Error!</h4>
          <p>The application has detected the following configuration issues. Please resolve them for full functionality:</p>
          <hr>
          <ul>
            <% envErrors.forEach(function(error) { %>
              <li><%- error %></li>
            <% }); %>
          </ul>
        </div>
      <% } %>

      <h2 class="mt-4">Generated Documents</h2>

      <!-- New Row for CV Results -->
      <h3 class="mt-3">Tailored CVs</h3>
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Gemini CV Result
            </div>
            <div class="card-body" id="geminiCVResult" style="white-space: pre-wrap;">
              <%- geminiCVResult %>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI CV Result
            </div>
            <div class="card-body" id="openAICVResult" style="white-space: pre-wrap;">
              <%- openAICVResult %>
            </div>
          </div>
        </div>
      </div>

      <!-- Existing Row for Cover Letter Results -->
      <h3 class="mt-4">Cover Letters</h3>
      <div class="row mt-3">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              Gemini Cover Letter Result
            </div>
            <div class="card-body" id="geminiCoverLetterResult" style="white-space: pre-wrap;">
              <%- geminiCoverLetterResult %>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI Cover Letter Result
            </div>
            <div class="card-body" id="openAICoverLetterResult" style="white-space: pre-wrap;">
              <%- openAICoverLetterResult %>
            </div>
          </div>
        </div>
      </div>

      <h2 class="mt-4">Generate Documents</h2>
      <form class="mt-4" action="/" method="POST">
        <div class="mb-3">
          <label for="token" class="form-label">Token</label>
          <input type="text" class="form-control" id="token" placeholder="Enter token" name="token" >
        </div>
        <div class="mb-3">
          <label for="company" class="form-label">Company name</label>
          <input type="text" class="form-control" id="company" placeholder="Enter company name" name="company" >
        </div>
        <div class="mb-3 form-check">
          <input type="checkbox" class="form-check-input" id="searchCompany" name="searchCompany" value="true" checked>
          <label class="form-check-label" for="searchCompany">Attempt to use specific information about the company (if name provided)</label>
        </div>
        <div class="mb-3">
          <label for="position" class="form-label">Position</label>
          <input type="text" class="form-control" id="position" placeholder="Enter position" name="position">
        </div>
        <div class="mb-3">
          <label for="job" class="form-label">Job description (will be used for CV and Cover Letter)</label>
          <textarea id="job" class="form-control" rows="15" name="job" placeholder="Paste the full job description here..."></textarea>
        </div>
        <div class="mb-3">
          <label for="language" class="form-label">Language</label><br/>
          <input type="radio" id="languageen" name="language" value="English" checked>
          <label for="languageen" class="form-label">English</label>
          <input type="radio" id="languagefr" name="language" value="French">
          <label for="languagefr" class="form-label">French</label>
        </div>
        <div class="mb-3">
          <label for="words-number" class="form-label">Number of words (for Cover Letter)</label>
          <input type="number" class="form-control" id="words-number" placeholder="Enter number of words for cover letter" name="words" value="100">
        </div>
        <button type="submit" class="btn btn-primary">Generate</button>
      </form>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const searchCompanyCheckbox = document.getElementById('searchCompany');
        const companyInput = document.getElementById('company');
        const companyLabel = document.querySelector('label[for="company"]');

        function updateCompanyInputState() {
          if (searchCompanyCheckbox.checked) {
            companyInput.disabled = false;
            companyInput.placeholder = "Enter company name (required for company-specific info)";
            companyLabel.textContent = "Company name (required for search)";
            if (companyInput.value === 'Unknown') {
              companyInput.value = '';
            }
          } else {
            companyInput.disabled = true;
            companyInput.placeholder = "Company information will not be used";
            companyLabel.textContent = "Company name (will not be used)";
            companyInput.value = 'Unknown';
          }
        }

        searchCompanyCheckbox.addEventListener('change', updateCompanyInputState);
        updateCompanyInputState();
      });
    </script>
  </body>
</html>
```

With these changes:
1.  When the application starts, it checks for `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `AUTH_TOKEN`.
2.  If any are missing or `AUTH_TOKEN` is empty, corresponding error messages are added to the `envErrors` array and logged to the console.
3.  The `index.ejs` page will display these errors in a red Bootstrap alert box at the top if `envErrors` is not empty.
4.  If `AUTH_TOKEN` is not set on the server, form submissions via the POST route will be rejected with a security message, enhancing the application's robustness.
