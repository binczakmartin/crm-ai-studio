/**
 * @file Thread Schema
 * @description Zod schema and TypeScript type for chat threads (conversations).
 * @remarks Threads are workspace-scoped and contain ordered messages.
 */
import { z } from 'zod';
/** Schema for a thread record. */
export declare const ThreadSchema: z.ZodObject<{
    id: z.ZodString;
    workspaceId: z.ZodString;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    workspaceId: string;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    title?: string | null | undefined;
}, {
    id: string;
    workspaceId: string;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    title?: string | null | undefined;
}>;
export type Thread = z.infer<typeof ThreadSchema>;
//# sourceMappingURL=thread.d.ts.map