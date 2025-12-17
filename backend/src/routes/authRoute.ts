// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const authRouter = Router();

authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);

export default authRouter;