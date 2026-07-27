import { Router } from 'express';
import { db } from '../db';
import { SQLiteUserRepository } from '../repositories/SQLiteUserRepository';
import { SQLiteAuditRepository } from '../repositories/SQLiteAuditRepository';
import { AuthenticationService } from '../services/AuthenticationService';
import { AuthenticationController } from '../controllers/AuthenticationController';

const userRepo = new SQLiteUserRepository(db);
const auditRepo = new SQLiteAuditRepository(db);
const authService = new AuthenticationService(userRepo, auditRepo);
const authController = new AuthenticationController(authService);

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
