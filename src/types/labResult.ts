// Shared across every lab (not just Lab 1)

export interface QuestionResult {
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface LabResult {
  score: number;
  results: QuestionResult[];
}
