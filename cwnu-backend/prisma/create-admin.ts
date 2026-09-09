import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'System';
const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Administrator';

if (!email || !password) {
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.');
}

if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
  throw new Error('ADMIN_PASSWORD must be 8+ characters with uppercase, lowercase, and a number.');
}

async function createAdmin() {
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, passwordHash, role: UserRole.ADMIN, isActive: true },
    create: { email, firstName, lastName, passwordHash, role: UserRole.ADMIN, isActive: true },
    select: { email: true, role: true },
  });

  console.log(`Admin account ready: ${admin.email} (${admin.role})`);
}

createAdmin()
  .catch((error) => {
    console.error('Unable to create admin account:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
