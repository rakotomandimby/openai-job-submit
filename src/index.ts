
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
// import { getResult } from './ask-openai';
import { getResult } from './ask-gemini';

const app = express();
const port = process.env.PORT || 3000; // Allow port configuration via environment variable

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.render('index', { message: "Waiting for your question" });
});

app.post('/', async (req: Request, res: Response) => {
  const { company, job, language, position, characters, token } = req.body;

  // Input validation
  if (!company || !position || !job || !language || !characters || !token) {
    return res.render('index', { message: "Please fill all the fields" });
  }

  // Token validation - Ideally, use a more robust authentication mechanism
  if (token !== 'mandimby7') { // Store token in environment variable
    return res.render('index', { message: "Invalid token" }); 
  }

  try {
    const result = await getResult(company, position, job, language, characters);
    res.render('index', { message: result }); // EJS should handle HTML escaping by default
  } catch (error) {
    console.error("Error processing request:", error); // Log errors for debugging
    res.status(500).render('index', { message: "An error occurred" }); 
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
