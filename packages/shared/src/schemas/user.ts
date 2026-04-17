import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  firebaseUid: z.string(),
  displayName: z.string().nullable(),
});

export type User = z.infer<typeof userSchema>;
