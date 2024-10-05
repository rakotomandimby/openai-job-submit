
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
import { getResult as setOpenAIResult } from './ask-openai';
import { getResult as getGeminiResult } from './ask-gemini';
import { getHrConversation } from './hr-conversation';


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
app.get('/view-conversation/lang/:lang', async (req: Request, res: Response) => {
  // lang is either "english" or "french". Other values must return a 404
  if (req.params.lang !== 'english' && req.params.lang !== 'french') {
    return res.status(404).send('Not found');
  }
  const messages = await getHrConversation(req.params.lang);
  res.render(`${req.params.lang}-conversation-view`, {messages: messages});
});


app.post('/', async (req: Request, res: Response) => {
  const { company, job, language, position, characters, token } = req.body;

  // Input validation
  if (!company || !position || !job || !language || !characters || !token) {
    return res.render('index', { geminiMessage: "Missing required fields", openAIMessage: "Missing required fields" });
  }

  // Token validation - Ideally, use a more robust authentication mechanism
  if (token !== 'mandimby7') { // Store token in environment variable
    return res.render('index', { geminiMessage: "Invalid token", openAIMessage: "Invalid token" }); 
  }

  try {
    const geminiResult = await getGeminiResult(company, position, job, language, characters);
    const openAIResult = await setOpenAIResult(company, position, job, language, characters);
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
