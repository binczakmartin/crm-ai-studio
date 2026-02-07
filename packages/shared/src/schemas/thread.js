/**
 * @file Thread Schema
 * @description Zod schema and TypeScript type for chat threads (conversations).
 * @remarks Threads are workspace-scoped and contain ordered messages.
 */
import { z } from 'zod';
/** Schema for a thread record. */
export const ThreadSchema = z.object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    title: z.string().nullable().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
});
//# sourceMappingURL=thread.js.map