import { PrismaClient } from '@prisma/client';
import { hanaCharacter } from '../src/modules/characters/seeds/hana';

const prisma = new PrismaClient();

async function main() {
  await prisma.character.upsert({
    where: { id: hanaCharacter.id },
    update: {
      name: hanaCharacter.name,
      tagline: hanaCharacter.tagline,
      avatarUrl: hanaCharacter.avatarUrl,
      systemPrompt: hanaCharacter.systemPrompt,
      openingText: hanaCharacter.openingText,
    },
    create: hanaCharacter,
  });
  console.log('Seeded character:', hanaCharacter.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
