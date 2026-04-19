import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ScenarioCreate,
  ScenarioDetail,
  ScenarioSummary,
  ScenarioUpdate,
  Scene,
} from '@ai-reaigame/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ScenariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async listForPlayer(
    characterId: string,
    firebaseUid: string,
    email?: string,
  ): Promise<ScenarioSummary[]> {
    const user = await this.users.findOrCreateByFirebaseUid(firebaseUid, email);
    const [scenarios, conversation, progresses] = await Promise.all([
      this.prisma.scenario.findMany({
        where: { characterId, published: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.conversation.findUnique({
        where: { userId_characterId: { userId: user.id, characterId } },
      }),
      this.prisma.scenarioProgress.findMany({
        where: { userId: user.id },
      }),
    ]);
    const affinity = conversation?.affinity ?? 0;
    const completedIds = new Set(
      progresses.filter((p) => p.completedAt).map((p) => p.scenarioId),
    );
    return scenarios.map((s) => ({
      id: s.id,
      slug: s.slug,
      characterId: s.characterId,
      title: s.title,
      synopsis: s.synopsis,
      unlockAffinity: s.unlockAffinity,
      published: s.published,
      order: s.order,
      locked: affinity < s.unlockAffinity,
      completed: completedIds.has(s.id),
    }));
  }

  async getBySlug(slug: string): Promise<ScenarioDetail> {
    const scenario = await this.prisma.scenario.findUnique({
      where: { slug },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
          include: { choices: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!scenario) throw new NotFoundException(`Scenario ${slug} not found`);
    return this.toDetail(scenario);
  }

  async completeScenario(
    slug: string,
    firebaseUid: string,
    email: string | undefined,
    lastSceneKey: string,
    totalAffinityDelta: number,
  ) {
    const user = await this.users.findOrCreateByFirebaseUid(firebaseUid, email);
    const scenario = await this.prisma.scenario.findUnique({ where: { slug } });
    if (!scenario) throw new NotFoundException(`Scenario ${slug} not found`);

    const progress = await this.prisma.scenarioProgress.upsert({
      where: {
        userId_scenarioId: { userId: user.id, scenarioId: scenario.id },
      },
      update: { completedAt: new Date(), lastSceneKey },
      create: {
        userId: user.id,
        scenarioId: scenario.id,
        completedAt: new Date(),
        lastSceneKey,
      },
    });

    const conversation = await this.prisma.conversation.upsert({
      where: { userId_characterId: { userId: user.id, characterId: scenario.characterId } },
      update: {},
      create: { userId: user.id, characterId: scenario.characterId },
    });
    const clamped = Math.max(-50, Math.min(50, totalAffinityDelta));
    const newAffinity = Math.max(-100, Math.min(100, conversation.affinity + clamped));
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { affinity: newAffinity },
    });

    return {
      ok: true as const,
      progressId: progress.id,
      affinity: newAffinity,
      affinityDelta: clamped,
    };
  }

  async adminList(): Promise<ScenarioSummary[]> {
    const scenarios = await this.prisma.scenario.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
    return scenarios.map((s) => ({
      id: s.id,
      slug: s.slug,
      characterId: s.characterId,
      title: s.title,
      synopsis: s.synopsis,
      unlockAffinity: s.unlockAffinity,
      published: s.published,
      order: s.order,
    }));
  }

  async adminGet(id: string): Promise<ScenarioDetail> {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
          include: { choices: { orderBy: { order: 'asc' } } },
        },
      },
    });
    if (!scenario) throw new NotFoundException(`Scenario ${id} not found`);
    return this.toDetail(scenario);
  }

  async adminCreate(input: ScenarioCreate): Promise<ScenarioDetail> {
    const existing = await this.prisma.scenario.findUnique({ where: { slug: input.slug } });
    if (existing) throw new BadRequestException(`slug "${input.slug}" is already used`);
    const character = await this.prisma.character.findUnique({ where: { id: input.characterId } });
    if (!character) throw new NotFoundException(`Character ${input.characterId} not found`);

    const scenario = await this.prisma.scenario.create({
      data: {
        slug: input.slug,
        characterId: input.characterId,
        title: input.title,
        synopsis: input.synopsis,
        unlockAffinity: input.unlockAffinity,
        published: input.published,
        order: input.order,
      },
      include: {
        scenes: { include: { choices: true } },
      },
    });
    return this.toDetail(scenario);
  }

  async adminUpdate(id: string, patch: ScenarioUpdate): Promise<ScenarioDetail> {
    const existing = await this.prisma.scenario.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Scenario ${id} not found`);

    if (patch.slug && patch.slug !== existing.slug) {
      const clash = await this.prisma.scenario.findUnique({ where: { slug: patch.slug } });
      if (clash) throw new BadRequestException(`slug "${patch.slug}" is already used`);
    }

    const updated = await this.prisma.scenario.update({
      where: { id },
      data: {
        ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
        ...(patch.characterId !== undefined ? { characterId: patch.characterId } : {}),
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.synopsis !== undefined ? { synopsis: patch.synopsis } : {}),
        ...(patch.unlockAffinity !== undefined ? { unlockAffinity: patch.unlockAffinity } : {}),
        ...(patch.published !== undefined ? { published: patch.published } : {}),
        ...(patch.order !== undefined ? { order: patch.order } : {}),
      },
    });

    if (patch.scenes) {
      await this.replaceScenes(id, patch.scenes);
    }

    return this.adminGet(updated.id);
  }

  async adminDelete(id: string) {
    await this.prisma.scenario.delete({ where: { id } });
    return { ok: true as const };
  }

  private async replaceScenes(scenarioId: string, scenes: Scene[]) {
    await this.prisma.scene.deleteMany({ where: { scenarioId } });
    for (const [idx, scene] of scenes.entries()) {
      const created = await this.prisma.scene.create({
        data: {
          scenarioId,
          key: scene.key,
          kind: scene.kind,
          body: scene.body,
          nextKey: scene.nextKey ?? null,
          order: scene.order ?? idx,
        },
      });
      if (scene.choices && scene.choices.length > 0) {
        await this.prisma.choice.createMany({
          data: scene.choices.map((c, ci) => ({
            sceneId: created.id,
            label: c.label,
            affinityDelta: c.affinityDelta,
            nextKey: c.nextKey,
            order: c.order ?? ci,
          })),
        });
      }
    }
  }

  private toDetail(scenario: {
    id: string;
    slug: string;
    characterId: string;
    title: string;
    synopsis: string;
    unlockAffinity: number;
    published: boolean;
    order: number;
    scenes: Array<{
      id: string;
      key: string;
      kind: string;
      body: string;
      nextKey: string | null;
      order: number;
      choices: Array<{
        id: string;
        label: string;
        affinityDelta: number;
        nextKey: string;
        order: number;
      }>;
    }>;
  }): ScenarioDetail {
    return {
      id: scenario.id,
      slug: scenario.slug,
      characterId: scenario.characterId,
      title: scenario.title,
      synopsis: scenario.synopsis,
      unlockAffinity: scenario.unlockAffinity,
      published: scenario.published,
      order: scenario.order,
      scenes: scenario.scenes.map((s) => ({
        id: s.id,
        key: s.key,
        kind: s.kind as 'text' | 'choice' | 'end',
        body: s.body,
        nextKey: s.nextKey ?? null,
        order: s.order,
        choices: s.choices.map((c) => ({
          id: c.id,
          label: c.label,
          affinityDelta: c.affinityDelta,
          nextKey: c.nextKey,
          order: c.order,
        })),
      })),
    };
  }
}
