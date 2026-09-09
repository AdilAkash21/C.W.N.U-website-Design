import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(2).max(120),
  message: z.string().min(10).max(5000),
});
const statusSchema = z.object({ status: z.enum(['NEW', 'READ', 'IN_PROGRESS', 'REPLIED', 'RESOLVED', 'CLOSED']) });
const replySchema = z.object({ message: z.string().min(1).max(5000) });

async function createContact(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Please provide valid contact details', 'VALIDATION_ERROR');
    const authReq = req as AuthenticatedRequest;
    const conversation = await prisma.contactConversation.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        userId: authReq.user?.id,
        messages: { create: { body: parsed.data.message, authorId: authReq.user?.id } },
      },
      include: { messages: true },
    });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    if (admins.length) await prisma.activity.createMany({
      data: admins.map((admin) => ({ userId: admin.id, type: 'NOTICE_VIEW', description: `New contact message from ${conversation.name}: ${conversation.subject}`, metadata: { conversationId: conversation.id } })),
    });
    res.status(201).json({ success: true, data: conversation, message: 'Message sent successfully. The administrator will review your message and respond as soon as possible.' });
  } catch (error) { next(error); }
}

async function listConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const isAdmin = req.user.role === 'ADMIN';
    const requestedStatus = typeof req.query.status === 'string' ? req.query.status : '';
    const parsedStatus = requestedStatus ? statusSchema.safeParse({ status: requestedStatus }) : null;
    if (parsedStatus && !parsedStatus.success) throw new AppError(400, 'Invalid conversation status', 'VALIDATION_ERROR');
    const conversations = await prisma.contactConversation.findMany({
      where: isAdmin ? {
        ...(typeof req.query.search === 'string' ? { OR: [{ name: { contains: req.query.search, mode: 'insensitive' } }, { subject: { contains: req.query.search, mode: 'insensitive' } }, { email: { contains: req.query.search, mode: 'insensitive' } }] } : {}),
        ...(parsedStatus?.success ? { status: parsedStatus.data.status } : {}),
      } : { userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, assignedTo: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: conversations });
  } catch (error) { next(error); }
}

async function reply(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') throw new AppError(403, 'Administrator access required', 'FORBIDDEN');
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Response cannot be empty', 'VALIDATION_ERROR');
    const conversation = await prisma.contactConversation.findUnique({ where: { id: req.params.id } });
    if (!conversation) throw new AppError(404, 'Conversation not found', 'NOT_FOUND');
    const updated = await prisma.$transaction(async (tx) => {
      await tx.contactMessage.create({ data: { conversationId: conversation.id, authorId: req.user!.id, body: parsed.data.message } });
      return tx.contactConversation.update({ where: { id: conversation.id }, data: { status: 'REPLIED' }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    });
    if (conversation.userId) await prisma.activity.create({ data: { userId: conversation.userId, type: 'NOTICE_VIEW', description: 'An administrator has responded to your contact message.', metadata: { conversationId: conversation.id } } });
    res.json({ success: true, data: updated, message: 'Response sent successfully.' });
  } catch (error) { next(error); }
}

async function updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'ADMIN') throw new AppError(403, 'Administrator access required', 'FORBIDDEN');
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid conversation status', 'VALIDATION_ERROR');
    const conversation = await prisma.contactConversation.update({ where: { id: req.params.id }, data: { status: parsed.data.status } });
    res.json({ success: true, data: conversation, message: 'Conversation status updated successfully.' });
  } catch (error) { next(error); }
}

export const contactRoutes = Router();
contactRoutes.post('/', createContact);
contactRoutes.get('/', authMiddleware, asyncHandler(listConversations));
contactRoutes.post('/:id/reply', authMiddleware, asyncHandler(reply));
contactRoutes.patch('/:id/status', authMiddleware, asyncHandler(updateStatus));
