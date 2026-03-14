import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import prisma from '../agent/src/db/prisma.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  // Read admin credentials from environment or use defaults
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@openclaw.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    // Create admin user if not exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
        },
      });
      console.log(`✅ Created admin user: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }

    // Seed accounts from config/accounts.json
    const accountsPath = path.resolve(process.cwd(), 'config', 'accounts.json');
    if (!fs.existsSync(accountsPath)) {
      console.warn('⚠️  config/accounts.json not found - skipping account seeding');
    } else {
      const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
      let seededCount = 0;

      for (const account of accounts) {
        if (!account.username) continue;

        try {
          const existing = await prisma.account.findUnique({
            where: { username: account.username },
          });

          if (!existing) {
            await prisma.account.create({
              data: {
                id: `${account.username}-${Date.now()}`,
                username: account.username,
                isActive: account.isActive !== false,
              },
            });
            console.log(`  ➜ Added account: @${account.username}`);
            seededCount++;
          } else {
            console.log(`  ➜ Account already exists: @${account.username}`);
          }
        } catch (err) {
          console.error(`  ✗ Failed to add @${account.username}:`, err);
        }
      }

      console.log(`✅ Seeded ${seededCount} new accounts`);
    }

    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
