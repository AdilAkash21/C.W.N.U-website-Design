import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { changePasswordSchema, updateProfileSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { config } from '../config';

const uploadDirectory = path.resolve(__dirname, '../../uploads/avatars');
fs.mkdirSync(uploadDirectory, { recursive: true });
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, callback) => {
    callback(null, config.upload.allowedMimeTypes.filter((type) => type !== 'application/pdf').includes(file.mimetype));
  },
});

export class UserController {
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !['ADMIN', 'STAFF'].includes(req.user.role)) {
        throw new AppError(403, 'Staff or Admin access required', 'FORBIDDEN');
      }

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const role = typeof req.query.role === 'string' ? req.query.role.toUpperCase() : undefined;
      const where = {
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {}),
        ...(role && ['STUDENT', 'TEACHER', 'STAFF', 'ADMIN'].includes(role) ? { role: role as any } : {}),
      };

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, phone: true, dateOfBirth: true, address: true, bio: true, isActive: true, lastLoginAt: true, createdAt: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ success: true, data: users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, phone: true, dateOfBirth: true, address: true, bio: true, isActive: true, lastLoginAt: true, createdAt: true },
      });
      if (!user) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async createProvisionedUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }

      const result = z.object({
        body: z.object({
          firstName: z.string().min(2).max(50),
          lastName: z.string().min(2).max(50),
          email: z.string().email(),
          password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
          confirmPassword: z.string(),
          role: z.enum(['TEACHER', 'STAFF', 'ADMIN']),
          phone: z.string().optional(),
        }).refine((data) => data.password === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        }),
      }).safeParse({ body: req.body });

      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { firstName, lastName, email, password, role, phone } = result.data.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError(409, 'Email already registered', 'DUPLICATE_ENTRY');
      }

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          ...(role ? { role } : {}),
          phone,
          isActive: true,
        },
        select: { id: true, firstName: true, lastName: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
      });

      res.status(201).json({ success: true, data: user, message: `${role === 'STAFF' ? 'Staff' : role === 'TEACHER' ? 'Teacher' : 'Admin'} account created successfully` });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          phone: true,
          dateOfBirth: true,
          address: true,
          bio: true,
          isActive: true,
          createdAt: true,
        },
      });
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const result = updateProfileSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { firstName, lastName, phone, dateOfBirth, address, bio } = result.data.body;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, address, bio },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      res.json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }

      const result = z.object({
        body: z.object({
          firstName: z.string().min(2).max(50).optional(),
          lastName: z.string().min(2).max(50).optional(),
          email: z.string().email().optional(),
          role: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN']).optional(),
          isActive: z.boolean().optional(),
          phone: z.string().optional(),
          dateOfBirth: z.preprocess((value) => value === '' ? null : value, z.union([z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'), z.null()]).optional()),
          address: z.string().optional(),
          bio: z.string().max(500).optional(),
          password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).optional(),
        }).refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
      }).safeParse({ body: req.body });

      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { firstName, lastName, email, role, isActive, phone, dateOfBirth, address, bio, password } = result.data.body;
      const existingUser = email ? await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), NOT: { id: req.params.id } } }) : null;
      if (existingUser) {
        throw new AppError(409, 'Email already registered', 'DUPLICATE_ENTRY');
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: {
          firstName,
          lastName,
          ...(email ? { email: email.trim().toLowerCase() } : {}),
          role,
          ...(isActive !== undefined ? { isActive } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true, phone: true, dateOfBirth: true, address: true, bio: true, isActive: true, lastLoginAt: true, createdAt: true },
      });

      res.json({ success: true, data: updatedUser, message: 'User updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.file) {
        throw new AppError(400, 'Please select an image to upload', 'AVATAR_REQUIRED');
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      let previousUser: { avatar: string | null } | null = null;
      let user: { avatar: string | null };
      try {
        previousUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { avatar: true },
        });
        user = await prisma.user.update({
          where: { id: req.user.id },
          data: { avatar: avatarUrl },
          select: { avatar: true },
        });
      } catch (err) {
        if (fs.existsSync(path.resolve(uploadDirectory, req.file.filename))) {
          fs.unlinkSync(path.resolve(uploadDirectory, req.file.filename));
        }
        throw err;
      }

      if (previousUser?.avatar?.startsWith('/uploads/avatars/')) {
        const previousFile = path.resolve(uploadDirectory, path.basename(previousUser.avatar));
        if (previousFile !== path.resolve(uploadDirectory, req.file.filename) && fs.existsSync(previousFile)) {
          fs.unlinkSync(previousFile);
        }
      }

      res.json({ success: true, data: { avatarUrl: user.avatar }, message: 'Avatar uploaded successfully' });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }
      const result = changePasswordSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = z.object({ body: z.object({ role: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN']) }) }).safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }
      const { role } = result.data.body;
      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
      res.json({ success: true, data: user, message: 'User role updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new AppError(404, 'User not found', 'NOT_FOUND');
      }
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
      });
      res.json({ success: true, data: updatedUser, message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (err) {
      next(err);
    }
  }
}

export const userRoutes = Router();
export const userController = new UserController();

userRoutes.get('/', asyncHandler(userController.getUsers));
userRoutes.get('/me', asyncHandler(userController.getProfile));
userRoutes.get('/:id', asyncHandler(userController.getUser));
userRoutes.post('/', asyncHandler(userController.createProvisionedUser));
userRoutes.patch('/me', asyncHandler(userController.updateProfile));
userRoutes.post('/me/avatar', avatarUpload.single('avatar'), asyncHandler(userController.uploadAvatar));
userRoutes.patch('/me/password', asyncHandler(userController.changePassword));
userRoutes.patch('/:id', asyncHandler(userController.updateUser));
userRoutes.post('/:id/role', asyncHandler(userController.updateRole));
userRoutes.post('/:id/toggle-status', asyncHandler(userController.toggleUserStatus));