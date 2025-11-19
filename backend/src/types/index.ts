import { Request } from 'express';
import { Role } from '@prisma/client';

// JWT Payload unificado
export interface JWTPayload {
  userId: number;
  email: string;
  role: Role;
}

// Request con usuario autenticado
export interface AuthRequest extends Request {
  user?: JWTPayload;
}
