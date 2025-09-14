
export interface ErrorDetail {
  lineNumber: number;
  error: string;
  explanation: string;
}

export interface AnalysisResponse {
  isValid: boolean;
  errors: ErrorDetail[];
  correctedCode: string;
  bestPractices: string[];
}
