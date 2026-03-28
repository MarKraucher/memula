import { describe, it, expect } from "vitest";
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
} from "@/lib/schemas";

describe("createNoteSchema", () => {
  it("validates a minimal text note", () => {
    const result = createNoteSchema.safeParse({
      title: "My note",
      content_type: "text",
    });
    expect(result.success).toBe(true);
  });

  it("validates a link note with URL", () => {
    const result = createNoteSchema.safeParse({
      title: "Interesting article",
      content_type: "link",
      source_url: "https://example.com/article",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = createNoteSchema.safeParse({
      title: "",
      content_type: "text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = createNoteSchema.safeParse({
      title: "x".repeat(201),
      content_type: "text",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid content_type", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "podcast",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "link",
      source_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts tags as string array", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "text",
      tags: ["python", "AI"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts category_ids as UUID array", () => {
    const result = createNoteSchema.safeParse({
      title: "Note",
      content_type: "text",
      category_ids: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });
});

describe("updateNoteSchema", () => {
  it("validates partial update", () => {
    const result = updateNoteSchema.safeParse({
      title: "Updated title",
    });
    expect(result.success).toBe(true);
  });

  it("validates empty object (no changes)", () => {
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("noteQuerySchema", () => {
  it("validates default query", () => {
    const result = noteQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.sort).toBe("newest");
    }
  });

  it("validates query with filters", () => {
    const result = noteQuerySchema.safeParse({
      content_type: "link",
      search: "python",
      sort: "alphabetical",
      limit: "10",
    });
    expect(result.success).toBe(true);
  });
});
