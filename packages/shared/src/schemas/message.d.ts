/**
 * @file Message Schema
 * @description Zod schema and TypeScript type for chat messages (user, assistant, system).
 * @remarks Messages are immutable once created. Citations are stored as JSONB arrays.
 */
import { z } from 'zod';
export declare const MessageRoleSchema: z.ZodEnum<["user", "assistant", "system"]>;
/** Schema for a chat message. */
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    threadId: z.ZodString;
    workspaceId: z.ZodString;
    role: z.ZodEnum<["user", "assistant", "system"]>;
    content: z.ZodString;
    citations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        evidenceId: z.ZodString;
        evidenceType: z.ZodEnum<["tool_result", "chunk"]>;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }, {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    threadId: string;
    workspaceId: string;
    content: string;
    citations: {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }[];
    role: "user" | "assistant" | "system";
    metadata: Record<string, unknown>;
    createdAt?: string | undefined;
}, {
    id: string;
    threadId: string;
    workspaceId: string;
    content: string;
    role: "user" | "assistant" | "system";
    createdAt?: string | undefined;
    citations?: {
        evidenceId: string;
        evidenceType: "tool_result" | "chunk";
        index: number;
        label?: string | undefined;
    }[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/** Schema for creating a new message (from user). */
export declare const CreateMessageSchema: z.ZodObject<{
    content: z.ZodString;
    workspaceId: z.ZodString;
    threadId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    content: string;
    threadId?: string | undefined;
}, {
    workspaceId: string;
    content: string;
    threadId?: string | undefined;
}>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
//# sourceMappingURL=message.d.ts.map