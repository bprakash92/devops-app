
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isValid: {
      type: Type.BOOLEAN,
      description: "Whether the provided code snippet is valid.",
    },
    errors: {
      type: Type.ARRAY,
      description: "A list of syntax errors found in the code. Should be an empty array if the code is valid.",
      items: {
        type: Type.OBJECT,
        properties: {
          lineNumber: {
            type: Type.INTEGER,
            description: "The exact line number where the error occurred.",
          },
          error: {
            type: Type.STRING,
            description: "A short description of the error (e.g., 'Indentation error').",
          },
          explanation: {
            type: Type.STRING,
            description: "A human-friendly explanation of the issue and why it's a problem.",
          },
        },
        required: ["lineNumber", "error", "explanation"],
      },
    },
    correctedCode: {
      type: Type.STRING,
      description: "The complete, corrected version of the code snippet.",
    },
    bestPractices: {
      type: Type.ARRAY,
      description: "A list of 2-3 relevant best practice suggestions for this type of file.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ["isValid", "errors", "correctedCode", "bestPractices"],
};

export const analyzeCode = async (code: string, fileType: string): Promise<AnalysisResponse> => {
  const prompt = `
    You are an intelligent DevOps Assistant designed to help a user named Bhanu Prakash. 
    Your goal is to check and debug syntax errors in DevOps-related files.
    You must be friendly, encouraging, and act like a DevOps tutor that teaches while correcting.
    
    Please analyze the following ${fileType} code snippet for syntax errors and best practices.

    Code to analyze:
    \`\`\`
    ${code}
    \`\`\`

    Your response MUST be in JSON format and adhere strictly to the provided schema.
    - Identify all syntax errors, including exact line numbers.
    - For each error, provide a simple, human-friendly explanation.
    - Generate a fully corrected version of the code snippet.
    - List 2-3 relevant best practices for this ${fileType}.
    - If the code is perfectly valid, the 'errors' array MUST be empty and 'isValid' MUST be true.
    - For the corrected code, just output the code itself without any surrounding markdown like \`\`\`.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    // Gemini can sometimes wrap the JSON in markdown, so we strip it.
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const parsedResponse = JSON.parse(cleanedJsonText);
    return parsedResponse as AnalysisResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
       throw new Error(`Failed to analyze code: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the code.");
  }
};
