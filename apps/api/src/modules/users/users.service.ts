import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private devAdminUids(): Set<string> {
    const raw = this.config.get<string>('DEV_ADMIN_UIDS') ?? '';
    return new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
  }

  async findOrCreateByFirebaseUid(firebaseUid: string, email?: string) {
    const shouldBeAdmin = this.devAdminUids().has(firebaseUid);
    const user = await this.prisma.user.upsert({
      where: { firebaseUid },
      update: shouldBeAdmin ? { isAdmin: true } : {},
      create: {
        firebaseUid,
        displayName: email?.split('@')[0] ?? null,
        isAdmin: shouldBeAdmin,
      },
    });
    return user;
  }
}
