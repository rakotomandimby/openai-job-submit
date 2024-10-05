
import sqlite3 from 'sqlite3';
import QuestionAnswer from './question-answer-model';

export async function getHrConversation(lang: string): Promise<QuestionAnswer[]> {
  const conversationLanguage = lang;

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(`./${conversationLanguage}-conversation.db`);
    db.serialize(() => {
      db.all("SELECT question, answer FROM messages ORDER BY id ASC", (err, rows) => {
        if (err) {
          reject(err);
        }
        // Map the rows to the QuestionAnswer type
        const result: QuestionAnswer[] = rows.map((row: any) => ({
          question: row.question,
          answer: row.answer
        }));
        resolve(result);
      });
    });
    db.close();
  });
}
