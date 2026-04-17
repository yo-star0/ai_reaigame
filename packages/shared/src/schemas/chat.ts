import { z } from 'zod';

export const messageRoleSchema = z.enum(['user', 'assistant']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const messageSchema = z.object({
  id: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

export const sendMessageRequestSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const sendMessageResponseSchema = z.object({
  user: messageSchema,
  assistant: messageSchema,
  affinity: z.number().int(),
  affinityDelta: z.number().int(),
});

export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>;

export const messagesPageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});

export type MessagesPage = z.infer<typeof messagesPageSchema>;

export const llmReplyJsonSchema = z.object({
  reply: z.string(),
  affinity_delta: z.number().int().min(-5).max(5),
});

export type LlmReplyJson = z.infer<typeof llmReplyJsonSchema>;
