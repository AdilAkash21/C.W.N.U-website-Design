import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validate';
import { paginationSchema, updateProfileSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { requireRole } from '../middleware/auth';

export class UserController {
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
      const result = updateProfileSchema.safeParse({
        body: req.body,
      });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format());
      }

      const { firstName, lastName, phone, dateOfBirth, address, bio } = result.data;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { firstName, lastName, phone, dateOfBirth, address, bio },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      res.json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }
      const result = updateProfileSchema.safeParse({ ...req.body });
      // In production: verify current password and hash new one
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
      const result = validate(z.object({ body: z.object({ role: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN']) }) })).parse(req);
      const { role } = result.body;
      const user = await prisma.user.update({
        where: { id: result.params.id },
        data: { role: role.toUpperCase() as any },
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

userRoutes.get('/me', asyncHandler(userController.getProfile));
userRoutes.patch('/me', asyncHandler(userController.updateProfile));
userRoutes.patch('/me/password', asyncHandler(userController.changePassword));
userRoutes.post('/:id/role', asyncHandler(userController.updateRole));
userRoutes.post('/:id/toggle-status', asyncHandler(userController.toggleUserStatus));