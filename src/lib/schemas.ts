import { z } from "zod";

const contentTypes = ["link", "text", "video", "image", "recipe"] as const;

export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).nullish(),
  content_type: z.enum(contentTypes).default("text"),
  source_url: z.string().url().nullish(),
  raw_content: z.string().max(50000).nullish(),
  structured_data: z.record(z.string(), z.unknown()).default({}),
  language: z.string().length(2).default("cs"),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
  category_ids: z.array(z.string().uuid()).max(10).default([]),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(2000).nullish(),
  content_type: z.enum(contentTypes).optional(),
  source_url: z.string().url().nullish(),
  raw_content: z.string().max(50000).nullish(),
  structured_data: z.record(z.string(), z.unknown()).optional(),
  language: z.string().length(2).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  category_ids: z.array(z.string().uuid()).max(10).optional(),
});

export const noteQuerySchema = z.object({
  search: z.string().max(200).optional(),
  content_type: z.enum(contentTypes).optional(),
  tag: z.string().optional(),
  category_id: z.string().uuid().optional(),
  sort: z.enum(["newest", "oldest", "alphabetical"]).default("newest"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteQueryInput = z.infer<typeof noteQuerySchema>;
