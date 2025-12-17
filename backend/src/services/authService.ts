import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import prisma from '../config/database.js';
import { IUserCreate, IUserLogin, JwtPayload } from '../types/index.js';

export class AuthService {
  // Register new user
  static async register(userData: IUserCreate) {
    const { email, password, name } = userData;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Generate JWT token
    const token = this.generateToken(user.id, user.email);
    
    return { user, token };
  }
  
  // Login user
  static async login(loginData: IUserLogin) {
    const { email, password } = loginData;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = this.generateToken(user.id, user.email);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }
  
  // Generate JWT token
  private static generateToken(userId: string, email: string): string {
    const payload: JwtPayload = {
      userId,
      email,
    };
    
    const secret: Secret = process.env.JWT_SECRET as Secret;
    const expiresEnv = process.env.JWT_EXPIRE;
    const expiresIn = expiresEnv && !isNaN(Number(expiresEnv)) ? Number(expiresEnv) : (expiresEnv || '7d');
    const options: SignOptions = { expiresIn: expiresIn as unknown as any };
    
    return jwt.sign(payload, secret, options);
  }
  
  // Get user profile
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}