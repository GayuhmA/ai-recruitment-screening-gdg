/**
 * Script to create a test user for login
 * Usage: node create-test-user.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create organization if not exists
  let org = await prisma.organization.findFirst({
    where: { id: 'local-org' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: 'local-org',
        name: 'Local Org'
      }
    });
    console.log('✅ Organization created:', org);
  } else {
    console.log('✅ Organization exists:', org);
  }

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: { email: 'admin@test.com' }
  });

  if (existingUser) {
    console.log('✅ Test user already exists:');
    console.log('   Email:', existingUser.email);
    console.log('   Name:', existingUser.fullName);
    return;
  }

  // Create test user
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.create({
    data: {
      organizationId: 'local-org',
      fullName: 'Admin User',
      email: 'admin@test.com',
      passwordHash,
      role: 'admin'
    }
  });

  console.log('✅ Test user created successfully!');
  console.log('');
  console.log('📧 Email: admin@test.com');
  console.log('🔑 Password: admin123');
  console.log('');
  console.log('You can now login with these credentials.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
