export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // Optional base64 image
  similarExercise?: {
    problem: string;
    solutionGuide: string;
  };
}

export interface TutorState {
  history: Message[];
  level: Level;
  step: number;
  attempts: number;
  currentProblem: string | null;
  userName: string | null;
}
