export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // Optional base64 image
  geometry?: {
    description: string;
    jsxgraph_code: string;
    labels: string[];
    explanation: string;
  };
}

export interface TutorState {
  history: Message[];
  level: Level;
  step: number;
  attempts: number;
  currentProblem: string | null;
  userName: string | null;
  grade: string | null;
  subject: string | null;
  isSetupComplete: boolean;
}
