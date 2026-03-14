import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function seed() {
  // Create/update admin user
  const hashedPassword = await bcrypt.hash('@Agusahmad17', 10);
  const admin = await prisma.user.upsert({
    where: { id: 'admin-1' },
    update: {
      email: 'agusahmad1997@gmail.com',
      password: hashedPassword,
      name: 'Admin',
    },
    create: {
      id: 'admin-1',
      email: 'agusahmad1997@gmail.com',
      password: hashedPassword,
      name: 'Admin',
    },
  });
  console.log('Admin user ensured:', admin.email);

  // Load accounts from config file
  try {
    const accountsConfig = JSON.parse(fs.readFileSync('config/accounts.json', 'utf8'));
    for (const account of accountsConfig) {
      if (account.username) {
        try {
          const created = await prisma.account.upsert({
            where: { username: account.username },
            update: { isActive: account.isActive !== false },
            create: {
              id: `${account.username}-${Date.now()}`,
              username: account.username,
              isActive: account.isActive !== false,
            },
          });
          console.log(`Ensured account exists: @${created.username}`);
        } catch (err: any) {
          if (!err.message.includes('Uniqueness')) {
            console.error(`Failed to create account ${account.username}:`, err);
          }
        }
      }
    }
  } catch (error) {
    console.log('No accounts.json found or error reading it:', error.message);
  }

  console.log('✅ Seeding complete');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
