import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { config } from '../config';
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from '../validators';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse({ body: req.body });
      if (!parsed.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
      const { password, role, rememberMe } = req.body;
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
      }
      if (role && user.role !== role.toUpperCase()) {
        throw new AppError(403, `This account is registered as a ${user.role.toLowerCase()}. Please choose the correct sign-in option.`, 'ROLE_MISMATCH');
      }

      const lastLoginAt = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt },
      });

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.accessSecret as jwt.Secret,
        { expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'] }
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret as jwt.Secret,
        { expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'] }
      );

      const existingToken = await prisma.refreshToken.findFirst({ where: { userId: user.id } });
      if (existingToken) {
        await prisma.refreshToken.update({
          where: { id: existingToken.id },
          data: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            revokedAt: null,
          },
        });
      } else {
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(rememberMe ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}),
      });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          tokens: { accessToken, refreshToken, expiresIn: 900 },
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            isActive: user.isActive,
            lastLoginAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = registerSchema.safeParse({ body: req.body });
      if (!parsed.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
      const { firstName, lastName, password, role, phone } = req.body;
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      if (role !== 'STUDENT') {
        throw new AppError(403, 'Teacher and staff accounts must be created by an administrator', 'ROLE_PROVISIONING_REQUIRED');
      }
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

      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.accessSecret as jwt.Secret,
        { expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'] }
      );
      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret as jwt.Secret,
        { expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'] }
      );

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({
        success: true,
        data: { user, tokens: { accessToken, refreshToken, expiresIn: 900 } },
        message: 'Account created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
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
        config.jwt.accessSecret as jwt.Secret,
        { expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'] }
      );

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: token,
          tokens: { accessToken, refreshToken: token, expiresIn: 900 },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = forgotPasswordSchema.safeParse({ body: req.body });
      if (!parsed.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent' });
        return;
      }
      res.json({ success: true, message: 'Password reset instructions sent to your email' });
    } catch (err) {
      next(err);
    }
  }

  async confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resetPasswordSchema.safeParse({ body: req.body });
      if (!parsed.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
      throw new AppError(501, 'Password reset delivery is not configured', 'PASSWORD_RESET_UNAVAILABLE');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = changePasswordSchema.safeParse({ body: req.body });
      if (!parsed.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors as Record<string, string[]>);
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
      const { currentPassword, newPassword } = parsed.data.body;
      const currentUser = await prisma.user.findUnique({ where: { id: authReq.user.id }, select: { passwordHash: true } });
      if (!currentUser || !(await bcrypt.compare(currentPassword, currentUser.passwordHash))) {
        throw new AppError(400, 'Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id: authReq.user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } }),
        prisma.refreshToken.deleteMany({ where: { userId: authReq.user.id } }),
      ]);
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Password changed successfully. Please sign in again.' });
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

export const authRoutes = Router();
export const authController = new AuthController();

authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.post('/register', asyncHandler(authController.register));
authRoutes.post('/logout', asyncHandler(authController.logout));
authRoutes.post('/refresh', asyncHandler(authController.refresh));
authRoutes.post('/password-reset/request', asyncHandler(authController.requestPasswordReset));
authRoutes.post('/password-reset/confirm', asyncHandler(authController.confirmPasswordReset));
authRoutes.post('/password/change', authMiddleware, asyncHandler(authController.changePassword));
authRoutes.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));