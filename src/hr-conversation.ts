import sqlite3 from 'sqlite3';
import QuestionAnswer from './question-answer-model';

export async function getHrConversation(lang: string): Promise<QuestionAnswer[]> {
  const conversationLanguage = lang;

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(`./${conversationLanguage}-conversation.db`);
    db.serialize(() => {
      db.all("SELECT id, question, answer FROM messages ORDER BY id ASC", (err, rows) => {
        if (err) {
          reject(err);
        }
        // Map the rows to the QuestionAnswer type
        const result: QuestionAnswer[] = rows.map((row: any) => ({
          id: row.id,
          question: row.question,
          answer: row.answer
        }));
        resolve(result);
      });
    });
    db.close();
  });
}

export async function updateHrConversation(lang: string, messages: QuestionAnswer[]): Promise<void> {
  const conversationLanguage = lang;

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(`./${conversationLanguage}-conversation.db`);

    db.serialize(() => {
      // Start a transaction
      db.run("BEGIN TRANSACTION");

      // Delete all existing records
      db.run("DELETE FROM messages", (err) => {
        if (err) {
          db.run("ROLLBACK");
          return reject(err);
        }

        // Insert new records
        const stmt = db.prepare("INSERT INTO messages (id, question, answer) VALUES (?, ?, ?)");
        for (const message of messages) {
          stmt.run(message.id, message.question, message.answer, (err:string) => {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }
          });
        }
        stmt.finalize();

        // Commit the transaction
        db.run("COMMIT", (err) => {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }
          db.close();
          resolve();
        });
      });
    });

  });
}
