import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../lib/db';

@Injectable()
export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        // Don't return passwordHash
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getMockCurrentUser() {
    // Return mock user untuk development
    // Nanti bisa ambil user pertama dari database atau create default user
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        organizationId: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Return default mock user jika belum ada di database
      return {
        id: 'mock-user-id',
        organizationId: 'mock-org-id',
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'recruiter',
        createdAt: new Date().toISOString(),
      };
    }

    return user;
  }
}
