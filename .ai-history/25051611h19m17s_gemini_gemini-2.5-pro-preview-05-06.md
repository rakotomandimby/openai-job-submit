# Option to not search about the target enterprise 

The user generally knows the target enterprise.
But when the job advertisement is made by a headhunter, the user may not know the target enterprise.
Therefore, the user should be able to choose if he wants to search about the target enterprise or not.

This is currently partially implemented in the code.
I want to add more user friendly option: when the user selects the option not to search about the target enterprise in the user interface, the input field for the target enterprise should be disabled so that the user cannot enter anything in it.

But if the user selects the option to search about the target enterprise, the input field for the target enterprise should be enabled and the user interface must remind the user that he must enter the target enterprise.

Propose me the changes to make to the user interface in order to achieve all that.



# This is gemini-2.5-pro-preview-05-06 answer (5k in, 2k out)

Okay, I can help you with that. This will involve adding some JavaScript to your `./views/index.ejs` file to dynamically enable/disable the company name input field and update its placeholder based on the checkbox state.

Here's how you can modify your `./views/index.ejs` file:

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
          <!-- Removed (or 'Unknown') from placeholder, JS will handle it -->
          <input type="text" class="form-control" id="company" placeholder="Enter company name" name="company" >
        </div>
        <!-- Checkbox for searching company info -->
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
            companyLabel.textContent = "Company name (required for search)"; // Update label text
            // If the value was 'Unknown' (from a previous uncheck), clear it to encourage user input
            if (companyInput.value === 'Unknown') {
              companyInput.value = '';
            }
          } else {
            companyInput.disabled = true;
            companyInput.placeholder = "Company information will not be used";
            companyLabel.textContent = "Company name (will not be used)"; // Update label text
            // Set value to 'Unknown' so backend handles it gracefully if form is submitted.
            // The backend already checks for 'Unknown' in conjunction with searchCompanyInfo.
            companyInput.value = 'Unknown';
          }
        }

        // Add event listener to the checkbox
        searchCompanyCheckbox.addEventListener('change', updateCompanyInputState);

        // Initial call to set the correct state when the page loads
        updateCompanyInputState();
      });
    </script>
  </body>
</html>
```

**Key changes in `./views/index.ejs`:**

1.  **Company Input Placeholder:** The `placeholder` for the company input (`id="company"`) has been changed from `"Enter company name (or 'Unknown')"` to simply `"Enter company name"`. The JavaScript will now manage the placeholder and value more dynamically.
2.  **JavaScript Block:**
    *   A `<script>` block has been added before the closing `</body>` tag.
    *   It waits for the `DOMContentLoaded` event to ensure all HTML elements are available.
    *   It gets references to the `searchCompany` checkbox, the `company` input field, and the `label` for the company input.
    *   The `updateCompanyInputState` function implements the logic:
        *   **If checkbox is checked:**
            *   Enables the `company` input.
            *   Sets its `placeholder` to "Enter company name (required for company-specific info)".
            *   Updates the `companyLabel` text to "Company name (required for search)".
            *   If the `companyInput` value was "Unknown" (e.g., from a previous uncheck action), it clears it.
        *   **If checkbox is unchecked:**
            *   Disables the `company` input.
            *   Sets its `placeholder` to "Company information will not be used".
            *   Updates the `companyLabel` text to "Company name (will not be used)".
            *   Sets the `companyInput.value` to "Unknown". This is useful because your backend logic in `src/system-instruction.ts` (`if(company !== 'Unknown' && searchCompanyInfo)`) already handles the "Unknown" case correctly when `searchCompanyInfo` is `false`.
    *   An event listener is attached to the `searchCompany` checkbox to call `updateCompanyInputState` whenever its state changes.
    *   `updateCompanyInputState()` is called once on page load to set the initial state of the company input field based on the checkbox's default `checked` state.

With these changes, the company name input field will now behave as you described, providing a more user-friendly experience.
