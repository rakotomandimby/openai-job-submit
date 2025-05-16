# Make number of words for cover letter predefined 

The current code lets the user define the number of words for the cover letter.
But this has no sense to let the user make a free choice.

I want to define a fixed choice of 3 options: 100, 200, 300 words.
I want 3 radio buttons for that.
They must be displayed inline, side by side, with a border in order to ease the choice.

Tell me the modifications make to `index.ejs` to implement that, and if there are any modifications to be made to other files, tell me which ones and what to do.





# This is gemini-2.5-pro-preview-05-06 answer (7k in, 2k out)

Okay, I can help you with that. This change will primarily affect the `views/index.ejs` file to update the user interface. The backend code should already handle the `words` parameter as a string, which the radio buttons will provide.

Here are the modifications:

### 1. Modify `views/index.ejs`

You need to replace the number input field for "Number of words (for Cover Letter)" with three radio buttons.

Here's the complete updated content for `./views/index.ejs`:

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
            <div class="card-body" id="geminiCVResult"> {/* Removed style="white-space: pre-wrap;" */}
              <%- geminiCVResult %>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              OpenAI CV Result
            </div>
            <div class="card-body" id="openAICVResult"> {/* Removed style="white-space: pre-wrap;" */}
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

**Key changes in `views/index.ejs`:**
*   The `div` containing the input for `words` (previously `id="words-number"`) has been replaced.
*   The new structure uses a `div` with Bootstrap classes `border p-2 rounded` to create the visual border and padding around the radio buttons.
*   Inside this `div`, three `div` elements with class `form-check form-check-inline` are used for each radio button and its label, making them appear side-by-side.
*   Each radio button has `name="words"` and a unique `id` (`words100`, `words200`, `words300`).
*   Their `value` attributes are set to "100", "200", and "300" respectively.
*   The first radio button (100 words) has the `checked` attribute, making it the default selection.

### 2. Other files (e.g., `src/index.ts`, `src/ask-openai.ts`, `src/ask-gemini.ts`, `src/system-instruction.ts`, `src/prompt.ts`)

No changes are required in these files.
The `req.body.words` in `src/index.ts` will now receive "100", "200", or "300" as a string value from the selected radio button. The existing logic that uses `words` as a string (e.g., in `getSystemInstructionCoverLetter` and `getPromptCoverLetter`) will continue to work correctly. The validation `!words` in `src/index.ts` also remains appropriate.

After applying the changes to `views/index.ejs`, your application will display the word count selection for cover letters as three inline radio buttons with a border.
