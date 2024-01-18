// start an express server with a single endpoint and a basic form using the easiest template engine
// npm install express ejs

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { Request, Response } from 'express';
import { getResult } from './ask-openai';

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true })); // Parses form-encoded data

// set the view engine to ejs
app.set('view engine', 'ejs');

// set the views directory
app.set('views', path.join(__dirname, 'views'));

// use the express-static middleware

app.use(express.static('public'));

// define the first route
app.get('/', (req: Request, res: Response) => {
  res.render('index', {message: "Mimi"});
});
app.post('/', (req: Request, res: Response) => {
  const company = req.body.company;
  const job = req.body.job;
  const language = req.body.language;
  const position = req.body.position;
  
  getResult(company, position, job, language)
    .then((result) => {
      // render, but without escaping html that are in message
      res.set('Content-Type', 'text/html');
      res.render('index', {message: result});
    })
    .catch((error) => {
      res.render('index', {message: error});
    });
});


// start the express server

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});