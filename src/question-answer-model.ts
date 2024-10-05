// Here we will the model for a database record, which is a "QuestionAnswer" object, having a "question" and "answer" field.

export default interface QuestionAnswer {
    id: number;
    question: string;
    answer: string;
}

