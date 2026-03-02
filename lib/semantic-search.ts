export const EMBEDDING_MODEL_ID = "onnx-community/embeddinggemma-300m-ONNX";
export const EMBEDDING_DIM = 256;
export const QUERY_PREFIX = "task: search result | query: ";
export const DOCUMENT_PREFIX = "title: none | text: ";

export type EmbeddingDtype = "q4" | "q8" | "fp32";

export function buildBookmarkEmbeddingText(input: {
  title: string;
  url: string;
  description?: string | null;
}) {
  const description = input.description?.trim();
  return [input.title.trim(), input.url.trim(), description]
    .filter(Boolean)
    .join("\n");
}

export function hashSemanticText(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`;
}

export function normalizeVector(values: number[]) {
  let norm = 0;
  for (let i = 0; i < values.length; i += 1) {
    norm += values[i] * values[i];
  }
  const length = Math.sqrt(norm) || 1;
  return values.map((value) => value / length);
}
