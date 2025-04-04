import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
import { getResult as getOpenAIResult } from './ask-openai';
import { getResult as getGeminiResult } from './ask-gemini';
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
  res.render('index', { geminiMessage: "Waiting for your question", openAIMessage: "Waiting for your question"});
});

app.post('/', async (req: Request, res: Response) => {
  const { company, job, language, position, words, token } = req.body;

  if (!company || !position || !job || !language || !words || !token) {
    return res.render('index', { geminiMessage: "Missing required fields", openAIMessage: "Missing required fields" });
  }

  if (token !== getAuthToken()) {
    return res.render('index', { geminiMessage: "Invalid token", openAIMessage: "Invalid token" }); 
  }

  try {
    const geminiResult = await getGeminiResult(company, position, job, language, words);
    const openAIResult = await getOpenAIResult(company, position, job, language, words);
    res.render('index', { geminiMessage: geminiResult, openAIMessage:openAIResult }); // EJS should handle HTML escaping by default
  } catch (error) {
    console.error("Error processing request:", error); // Log errors for debugging
    res.status(500).render('index', { message: "An error occurred" }); 
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
