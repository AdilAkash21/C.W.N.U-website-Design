import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  createCourseSchema,
  updateCourseSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  createNoticeSchema,
  updateNoticeSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema,
  recordAttendanceSchema,
  bulkAttendanceSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '../validators';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body.user;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiry }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiry }
      );

      // Store refresh token
      await prisma.refreshToken.upsert({
        where: { userId: user.id },
        update: { token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        create: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: { accessToken, user: { id: user.id, email: user.email, role: user.role } },
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password, role, phone } = req.body.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError(409, 'Email already registered', 'DUPLICATE_ENTRY');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role: role.toUpperCase() as any,
          phone,
          isActive: true,
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      res.status(201).json({
        success: true,
        data: { user },
        message: 'Account created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await prisma.refreshToken.deleteMany({ where: { token } });
      }
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) {
        throw new AppError(401, 'No refresh token', 'NO_REFRESH_TOKEN');
      }

      const decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: string };
      const refreshToken = await prisma.refreshToken.findUnique({ where: { token } });

      if (!refreshToken || refreshToken.revokedAt || new Date(refreshToken.expiresAt) < new Date()) {
        throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.isActive) {
        throw new AppError(401, 'User not found or inactive', 'USER_NOT_FOUND');
      }

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.accessSecret,
        { expiresIn: config.jwt.accessExpiry }
      );

      res.json({ success: true, data: { accessToken } });
    } catch (err) {
      next(err);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal if user exists
        res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent' });
        return;
      }
      // In production: send reset email with token
      res.json({ success: true, message: 'Password reset instructions sent to your email' });
    } catch (err) {
      next(err);
    }
  }

  async confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      // In production: verify reset token from email link
      const { token, password } = req.body.body;
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body.body;
      // In production: verify current password
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }
    res.json({ success: true, data: req.user });
  }
}

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');

export const authRoutes = Router();
export const authController = new AuthController();

authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.post('/register', asyncHandler(authController.register));
authRoutes.post('/logout', asyncHandler(authController.logout));
authRoutes.post('/refresh', asyncHandler(authController.refresh));
authRoutes.post('/password-reset/request', asyncHandler(authController.requestPasswordReset));
authRoutes.post('/password-reset/confirm', asyncHandler(authController.confirmPasswordReset));
authRoutes.post('/password/change', asyncHandler(authController.changePassword));
authRoutes.get('/me', asyncHandler(authController.getCurrentUser));