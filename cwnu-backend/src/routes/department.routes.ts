import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { createDepartmentSchema, updateDepartmentSchema, paginationSchema } from '../validators';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class DepartmentController {
  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = paginationSchema.safeParse({ query: req.query });
      if (!result.success) {
        throw new AppError(400, 'Invalid pagination parameters', 'VALIDATION_ERROR');
      }
      const { page, limit } = result.data.query;

      const [departments, total] = await prisma.$transaction([
        prisma.department.findMany({
          where: { isActive: true },
          include: { head: { select: { firstName: true, lastName: true, email: true } } },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.department.count({ where: { isActive: true } }),
      ]);

      res.json({
        success: true,
        data: departments,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  async getDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          head: { select: { firstName: true, lastName: true, email: true } },
          courses: { take: 5, select: { id: true, code: true, name: true } },
        },
      });

      if (!department) {
        throw new AppError(404, 'Department not found', 'NOT_FOUND');
      }

      res.json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const result = createDepartmentSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const { code, name, description, headId } = result.data.body;

      const department = await prisma.department.create({
        data: {
          code,
          name,
          description,
          headId,
          isActive: true,
        },
        include: { head: { select: { firstName: true, lastName: true, email: true } } },
      });

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        throw new AppError(403, 'Admin access required', 'FORBIDDEN');
      }
      const { id } = req.params;
      const result = updateDepartmentSchema.safeParse({ body: req.body });
      if (!result.success) {
        throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.format() as any);
      }

      const department = await prisma.department.update({
        where: { id },
        data: result.data,
        include: { head: { select: { firstName: true, lastName: true, email: true } } },
      });

      res.json({ success: true, data: department, message: 'Department updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const departmentRoutes = Router();
export const departmentController = new DepartmentController();

departmentRoutes.get('/', asyncHandler(departmentController.getDepartments));
departmentRoutes.get('/:id', asyncHandler(departmentController.getDepartment));
departmentRoutes.post('/', asyncHandler(departmentController.createDepartment));
departmentRoutes.put('/:id', asyncHandler(departmentController.updateDepartment));