import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findOrCreateByFirebaseUid(firebaseUid: string, email?: string) {
    return this.prisma.user.upsert({
      where: { firebaseUid },
      update: {},
      create: {
        firebaseUid,
        displayName: email?.split('@')[0] ?? null,
      },
    });
  }
}
