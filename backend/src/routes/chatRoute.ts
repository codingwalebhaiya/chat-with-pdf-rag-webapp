// src/routes/chat.routes.ts
import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const chatRouter = Router();
const chatController = new ChatController();

chatRouter.use(authenticate);

chatRouter.post('/sessions', ChatController.createSession);
chatRouter.get('/sessions', ChatController.getSessions);
chatRouter.get('/sessions/:sessionId', ChatController.getSession);
chatRouter.post('/sessions/:sessionId/message', chatController.sendMessage);
chatRouter.delete('/sessions/:sessionId', ChatController.deleteSession);

export default chatRouter;