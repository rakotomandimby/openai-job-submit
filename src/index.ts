import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
import { getResult as setOpenAIResult } from './ask-openai';
import { getResult as getGeminiResult } from './ask-gemini';
import { getHrConversation, updateHrConversation } from './hr-conversation'; // Import updateHrConversation
import QuestionAnswer from './question-answer-model';

const app = express();
const port = process.env.PORT || 3000; // Allow port configuration via environment variable

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add middleware to parse JSON body
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.render('index', { geminiMessage: "Waiting for your question", openAIMessage: "Waiting for your question"});
});

app.get('/conversation/mode/:mode/lang/:lang', async (req: Request, res: Response) => {
  const { lang, mode } = req.params;

  if (lang !== 'english' && lang !== 'french') {
    return res.status(404).send('Not found');
  }
  if (mode !== 'view' && mode !== 'edit') {
    return res.status(404).send('Not found');
  }
  const messages = await getHrConversation(lang);
  const pageTitle = lang === 'english' ? 'English Conversation' : 'Conversation en Francais';
  const save = lang === 'english' ? 'Save' : 'Enregistrer';
  const addLine = lang === 'english' ? 'Add Line' : 'Ajouter une ligne';
  res.render( `conversation-${mode}`, { messages, pageTitle , lang, save, addLine }); 
});

app.post('/update-conversation/lang/:lang', async (req: Request, res: Response) => {
  if (req.params.lang !== 'english' && req.params.lang !== 'french') {
    return res.status(404).send('Not found');
  }

  try {
    const messages: QuestionAnswer[] = Object.values(req.body).map((message: any) => ({
      id: message.id,
      question: message.question,
      answer: message.answer
    }));

    await updateHrConversation(req.params.lang, messages);
    res.status(200).send('Conversation updated successfully');
  } catch (error) {
    console.error("Error updating conversation:", error);
    res.status(500).send("An error occurred while updating the conversation.");
  }
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
