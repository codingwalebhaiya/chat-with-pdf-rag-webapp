import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from "../types/index.js"

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  const response: ApiResponse = {
    success: false,
    message: error.message || 'Internal server error',
  };
  
  res.status(statusCode).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};