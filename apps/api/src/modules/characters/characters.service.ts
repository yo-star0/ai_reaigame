import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CharactersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async list() {
    const characters = await this.prisma.character.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return characters.map((c) => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      avatarUrl: c.avatarUrl,
    }));
  }

  async detailForUser(characterId: string, firebaseUid: string, email?: string) {
    const [character, user] = await Promise.all([
      this.prisma.character.findUnique({ where: { id: characterId } }),
      this.users.findOrCreateByFirebaseUid(firebaseUid, email),
    ]);
    if (!character) throw new NotFoundException(`Character ${characterId} not found`);

    const conversation = await this.prisma.conversation.upsert({
      where: { userId_characterId: { userId: user.id, characterId: character.id } },
      update: {},
      create: { userId: user.id, characterId: character.id },
    });

    return {
      id: character.id,
      name: character.name,
      tagline: character.tagline,
      avatarUrl: character.avatarUrl,
      openingText: character.openingText,
      affinity: conversation.affinity,
      hasSeenOpening: conversation.hasSeenOpening,
    };
  }

  async completeOpening(characterId: string, firebaseUid: string, email?: string) {
    const user = await this.users.findOrCreateByFirebaseUid(firebaseUid, email);
    await this.prisma.conversation.update({
      where: { userId_characterId: { userId: user.id, characterId } },
      data: { hasSeenOpening: true },
    });
    return { ok: true as const };
  }
}
