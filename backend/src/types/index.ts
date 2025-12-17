

// User Types
export interface IUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  password: string;
  name?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

// PDF Types
export interface IPDFDocument {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  pages?: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPDFUpload {
  originalName: string;
  filename: string;
  filePath: string;
  fileSize: number;
}

// Chat Types
export interface IChatMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: Record<string, any>;
}

export interface IChatSession {
  id: string;
  userId: string;
  pdfId?: string;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  email: string;
}

// Express Request Extensions
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}