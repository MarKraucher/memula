export type ContentType = "link" | "text" | "video" | "image" | "recipe";
export type NoteStatus = "pending" | "processing" | "ready" | "error";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  content_type: ContentType;
  source_url: string | null;
  raw_content: string | null;
  structured_data: Record<string, unknown>;
  status: NoteStatus;
  processing_attempts: number;
  is_shared: boolean;
  share_id: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface NoteWithRelations extends Note {
  tags: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string | null }[];
  images: { id: string; storage_path: string; is_primary: boolean }[];
}

export interface Tag {
  id: string;
  name: string;
  usage_count: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  user_id: string | null;
}

export interface AiClassificationResult {
  content_type: ContentType;
  title: string;
  summary: string;
  structured_data: Record<string, unknown>;
  suggested_tags: string[];
  suggested_categories: string[];
  language: string;
}
