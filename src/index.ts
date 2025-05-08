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

