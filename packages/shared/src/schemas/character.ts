import { z } from 'zod';

export const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string(),
  avatarUrl: z.string().url(),
});

export type Character = z.infer<typeof characterSchema>;

export const characterDetailSchema = characterSchema.extend({
  affinity: z.number().int(),
  hasSeenOpening: z.boolean(),
  openingText: z.string(),
});

export type CharacterDetail = z.infer<typeof characterDetailSchema>;
