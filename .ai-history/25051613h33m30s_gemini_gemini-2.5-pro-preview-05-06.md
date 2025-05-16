# Add CSRF protection to the form

I want to add CSRF protection to the form. This will prevent CSRF attacks by ensuring that the form is submitted from the same origin as the server. The CSRF token should be included in the form as a hidden input field. The server should validate the token when processing the form submission.
Tell me the modifications to make to the code to add CSRF protection to the form.





# This is gemini-2.5-pro-preview-05-06 answer (7k in, 4k out)

Okay, I can help you add CSRF protection to your application. We'll use the `csurf` middleware for Express, along with `cookie-parser`.

Here's how we'll proceed:

1.  **Update `package.json`**: Add `csurf`, `@types/csurf`, `cookie-parser`, and `@types/cookie-parser` to your dependencies.
2.  **Modify `src/index.ts`**:
    *   Import and configure `cookie-parser` and `csurf`.
    *   Pass the CSRF token to your view in the `GET /` route.
    *   Ensure all error paths in the `POST /` route that re-render the form also pass a new CSRF token.
    *   Add an error handling middleware to catch CSRF validation errors.
3.  **Update `views/index.ejs`**:
    *   Add a hidden input field to your form to include the CSRF token.
    *   Add a section to display CSRF-related error messages.

Here are the detailed code modifications:

## 1. Update `package.json`

You'll need to add `cookie-parser` and `csurf` as dependencies, and their type definitions as devDependencies.

```json
{
  "name": "openai-test-01",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build": "rm -rfv dist && mkdir -pv dist/views && cp -rv views/* dist/views/ && /home/mihamina/Apps/node/bin/npx tsc",
    "start": "rm -rfv dist && mkdir -pv dist/views && cp -rv views/* dist/views/ && /home/mihamina/Apps/node/bin/npx tsc && /home/mihamina/Apps/node/bin/node dist/index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/cookie-parser": "^1.4.7",
    "@types/csurf": "^1.11.5",
    "@types/node": "^20.17.24",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.8.2"
  },
  "dependencies": {
    "@google/generative-ai": "^0.15.0",
    "@types/express": "^4.17.21",
    "body-parser": "^1.20.2",
    "cookie-parser": "^1.4.6",
    "csurf": "^1.11.0",
    "ejs": "^3.1.9",
    "express": "^4.18.2",
    "openai": "^4.17.4",
    "typescript-language-server": "^4.1.2"
  }
}
```
**Note:** After updating `package.json`, remember to run `npm install` (or `yarn install`) to install the new dependencies.

## 2. Modify `src/index.ts`

We'll integrate `cookie-parser` and `csurf`, pass the token to the view, and handle CSRF errors.

```typescript
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cookieParser from 'cookie-parser'; // Added
import csrf from 'csurf'; // Added
import { getOpenAICoverLetterResult, getOpenAICVResult } from './ask-openai';
import { getGeminiCoverLetterResult, getGeminiCVResult } from './ask-gemini';
import { getAuthToken } from './utils';

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

const configuredAuthToken = getAuthToken();
if (!configuredAuthToken) {
  envErrors.push("AUTH_TOKEN is not set or is empty. The application is insecure, and submissions will be blocked.");
}
// --- End Environment Variable Checks ---

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser middleware
const csrfProtection = csrf({ cookie: true }); // Setup csurf middleware

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static('public'));

// Define initial options for rendering the page, including a spot for form errors
const initialRenderOptions = {
  envErrors: envErrors,
  geminiCVResult: "Waiting for your job description for CV generation",
  openAICVResult: "Waiting for your job description for CV generation",
  geminiCoverLetterResult: "Waiting for your question for Cover Letter",
  openAICoverLetterResult: "Waiting for your question for Cover Letter",
  formError: null as string | null, // For displaying form-specific errors
};

app.get('/', csrfProtection, (req: Request, res: Response) => {
  res.render('index', {
    ...initialRenderOptions,
    csrfToken: (req as any).csrfToken() // Pass CSRF token to the template
  });
});

app.post('/', csrfProtection, async (req: Request, res: Response) => {
  const { job, language, position, words, token: submittedToken } = req.body;
  const companyFromRequest = req.body.company;
  const searchCompanyInfo = req.body.searchCompany === 'true';

  // Base options for re-rendering the form in case of errors in POST
  const baseRenderOptionsForPost = {
    envErrors: envErrors,
    geminiCVResult: "An error occurred or input was missing.",
    openAICVResult: "An error occurred or input was missing.",
    geminiCoverLetterResult: "An error occurred or input was missing.",
    openAICoverLetterResult: "An error occurred or input was missing.",
    csrfToken: (req as any).csrfToken(), // Crucial for re-rendering the form
    formError: null as string | null,
  };

  if (!job || !language || !position || !words || submittedToken === undefined) {
    return res.render('index', {
      ...baseRenderOptionsForPost,
      formError: "Missing required fields: job, language, position, words, or token.",
      geminiCVResult: "Missing required fields.",
      openAICVResult: "Missing required fields.",
      geminiCoverLetterResult: "Missing required fields.",
      openAICoverLetterResult: "Missing required fields."
    });
  }

  if (searchCompanyInfo && !companyFromRequest) {
    return res.render('index', {
      ...baseRenderOptionsForPost,
      formError: "Company name is required when 'Attempt to use specific information' is checked.",
      geminiCVResult: "Company name required.",
      openAICVResult: "Company name required.",
      geminiCoverLetterResult: "Company name required.",
      openAICoverLetterResult: "Company name required."
    });
  }

  let companyForProcessing: string;
  if (searchCompanyInfo) {
    companyForProcessing = companyFromRequest!;
  } else {
    companyForProcessing = 'Unknown';
  }

  if (!configuredAuthToken) {
    return res.render('index', {
      ...baseRenderOptionsForPost,
      formError: "Security Alert: Application AUTH_TOKEN is not configured. Submission rejected.",
      geminiCVResult: "AUTH_TOKEN not configured.",
      openAICVResult: "AUTH_TOKEN not configured.",
      geminiCoverLetterResult: "AUTH_TOKEN not configured.",
      openAICoverLetterResult: "AUTH_TOKEN not configured."
    });
  }

  if (submittedToken !== configuredAuthToken) {
    return res.render('index', {
      ...baseRenderOptionsForPost,
      formError: "Invalid token.",
      geminiCVResult: "Invalid token.",
      openAICVResult: "Invalid token.",
      geminiCoverLetterResult: "Invalid token.",
      openAICoverLetterResult: "Invalid token."
    });
  }

  try {
    const geminiCV = await getGeminiCVResult(job, position, language);
    const openAICV = await getOpenAICVResult(job, position, language);
    const geminiCoverLetter = await getGeminiCoverLetterResult(companyForProcessing, position, job, language, words, searchCompanyInfo);
    const openAICoverLetter = await getOpenAICoverLetterResult(companyForProcessing, position, job, language, words, searchCompanyInfo);

    res.render('index', {
      envErrors: envErrors,
      geminiCVResult: geminiCV,
      openAICVResult: openAICV,
      geminiCoverLetterResult: geminiCoverLetter,
      openAICoverLetterResult: openAICoverLetter,
      csrfToken: (req as any).csrfToken(), // Pass token for the rendered page (though form is usually gone on success)
      formError: null,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).render('index', {
      ...baseRenderOptionsForPost, // This includes csrfToken
      formError: "An unexpected error occurred while processing your request.",
      geminiCVResult: "Error during generation.",
      openAICVResult: "Error during generation.",
      geminiCoverLetterResult: "Error during generation.",
      openAICoverLetterResult: "Error during generation."
    });
  }
});

// CSRF error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.warn('CSRF Token Validation Failed for request to:', req.path);
    // Render the page again with an error message and a new CSRF token
    res.status(403).render('index', {
      ...initialRenderOptions, // Use initial state for results display
      csrfToken: (req as any).csrfToken ? (req as any).csrfToken() : '', // Attempt to get a new token
      formError: 'Invalid form submission token. Please refresh the page and try again. Ensure cookies are enabled in your browser.'
    });
  } else {
    // For other errors, pass them to the default Express error handler or other error handlers
    next(err);
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

## 3. Update `views/index.ejs`

Add the hidden CSRF token field to your form and a place to display form-related errors (like CSRF errors).

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/css/flag-icons.min.css" />
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
            <div class="card-body" id="geminiCVResult">
              <%- geminiCVResult %>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI CV Result
            </div>
            <div class="card-body" id="openAICVResult">
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

      <%# Display form-specific errors, including CSRF errors %>
      <% if (typeof formError !== 'undefined' && formError) { %>
        <div class="alert alert-danger mt-3" role="alert">
          <%- formError %>
        </div>
      <% } %>

      <form class="mt-4" action="/" method="POST">
        <%# CSRF Token %>
        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        
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
          <label class="form-label">Language</label>
          <div class="border p-2 rounded">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="languageen" name="language" value="English" checked>
              <label class="form-check-label" for="languageen">
                <span class="fi fi-gb me-2"></span>English
              </label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" id="languagefr" name="language" value="French">
              <label class="form-check-label" for="languagefr">
                <span class="fi fi-fr me-2"></span>French
              </label>
            </div>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">Number of words (for Cover Letter)</label>
          <div class="border p-2 rounded">
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="words" id="words100" value="100" checked>
              <label class="form-check-label" for="words100">100</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="words" id="words200" value="200">
              <label class="form-check-label" for="words200">200</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="words" id="words300" value="300">
              <label class="form-check-label" for="words300">300</label>
            </div>
          </div>
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

With these changes, your form will now be protected against CSRF attacks. The `csurf` middleware will handle the generation and validation of tokens. If a token is invalid or missing, the custom error handler will inform the user. Remember to install the new dependencies using `npm install`.
