import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { courseRoutes } from './course.routes';
import { departmentRoutes } from './department.routes';
import { enrollmentRoutes } from './enrollment.routes';
import { assignmentRoutes } from './assignment.routes';
import { attendanceRoutes } from './attendance.routes';
import { noticeRoutes } from './notice.routes';
import { dashboardRoutes } from './dashboard.routes';
import { adminRoutes } from './admin.routes';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', authMiddleware, userRoutes);
router.use('/courses', authMiddleware, courseRoutes);
router.use('/departments', authMiddleware, departmentRoutes);
router.use('/enrollments', authMiddleware, enrollmentRoutes);
router.use('/assignments', authMiddleware, assignmentRoutes);
router.use('/attendance', authMiddleware, attendanceRoutes);
router.use('/notices', authMiddleware, noticeRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/admin', authMiddleware, adminRoutes);

export { router as routes };