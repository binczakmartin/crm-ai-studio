/**
 * @file Workspace Schema
 * @description Zod schema and TypeScript type for workspaces.
 * @remarks Workspaces are the top-level tenant boundary. All entities are scoped to a workspace.
 */

import { z } from 'zod';

/** Schema for a workspace record. */
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  config: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
