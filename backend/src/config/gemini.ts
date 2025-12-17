// src/config/gemini.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const getChatModel = () => {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-pro",
    temperature: 0.7,
    maxOutputTokens: 1024,
  });
};

export const getEmbeddingsModel = () => {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: "embedding-001",
  });
};