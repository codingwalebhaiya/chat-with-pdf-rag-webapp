// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { ApiResponse, AuthRequest } from '../types/index.js';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        const response: ApiResponse = {
          success: false,
          message: 'Email and password are required',
        };
        res.status(400).json(response);
        return;
      }
      
      const result = await AuthService.register({ email, password, name });
      
      const response: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: result,
      };
      
      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(400).json(response);
    }
  }
  
  // Login user
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        const response: ApiResponse = {
          success: false,
          message: 'Email and password are required',
        };
        res.status(400).json(response);
        return;
      }
      
      const result = await AuthService.login({ email, password });
      
      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: result,
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(401).json(response);
    }
  }
  
  // Get user profile
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getProfile(userId);
      
      const response: ApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      };
      
      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: error.message,
      };
      res.status(404).json(response);
    }
  }
}