import { z } from 'zod';

export const sceneKindSchema = z.enum(['text', 'choice', 'end']);
export type SceneKind = z.infer<typeof sceneKindSchema>;

export const choiceSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1).max(200),
  affinityDelta: z.number().int().min(-10).max(10),
  nextKey: z.string().min(1).max(40),
  order: z.number().int().min(0).default(0),
});
export type Choice = z.infer<typeof choiceSchema>;

export const sceneSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1).max(40),
  kind: sceneKindSchema,
  body: z.string().min(0).max(4000),
  nextKey: z.string().max(40).nullable().optional(),
  order: z.number().int().min(0).default(0),
  choices: z.array(choiceSchema).default([]),
});
export type Scene = z.infer<typeof sceneSchema>;

export const scenarioSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  characterId: z.string(),
  title: z.string(),
  synopsis: z.string(),
  unlockAffinity: z.number().int(),
  published: z.boolean(),
  order: z.number().int(),
  locked: z.boolean().optional(),
  completed: z.boolean().optional(),
});
export type ScenarioSummary = z.infer<typeof scenarioSummarySchema>;

export const scenarioDetailSchema = scenarioSummarySchema.extend({
  scenes: z.array(sceneSchema),
});
export type ScenarioDetail = z.infer<typeof scenarioDetailSchema>;

export const scenarioCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'slugは小文字英数字とハイフンのみ'),
  characterId: z.string().min(1),
  title: z.string().min(1).max(120),
  synopsis: z.string().max(500).default(''),
  unlockAffinity: z.number().int().min(0).max(100).default(0),
  published: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});
export type ScenarioCreate = z.infer<typeof scenarioCreateSchema>;

export const scenarioUpdateSchema = scenarioCreateSchema.partial().extend({
  scenes: z.array(sceneSchema).optional(),
});
export type ScenarioUpdate = z.infer<typeof scenarioUpdateSchema>;

export const scenarioCompleteRequestSchema = z.object({
  lastSceneKey: z.string().min(1).max(40),
  totalAffinityDelta: z.number().int().min(-50).max(50),
});
export type ScenarioCompleteRequest = z.infer<typeof scenarioCompleteRequestSchema>;
