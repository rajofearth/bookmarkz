/// <reference lib="webworker" />

import {
  embedBookmarkQuery,
  warmupEmbeddingModel,
} from "@/lib/embedding-runtime";
import type { EmbeddingDtype } from "@/lib/semantic-search";

type WorkerRequest =
  | {
      id: number;
      type: "embed";
      text: string;
      preferred?: EmbeddingDtype;
    }
  | {
      id: number;
      type: "warmup";
      preferred?: EmbeddingDtype;
    };

type WorkerResponse =
  | {
      id: number;
      ok: true;
      type: "embed";
      result: { vector: number[]; dtype: EmbeddingDtype };
    }
  | {
      id: number;
      ok: true;
      type: "warmup";
      result: { warmed: true };
    }
  | {
      id: number;
      ok: false;
      error: string;
    };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;
  try {
    if (payload.type === "embed") {
      const result = await embedBookmarkQuery(payload.text, payload.preferred);
      const response: WorkerResponse = {
        id: payload.id,
        ok: true,
        type: "embed",
        result,
      };
      self.postMessage(response);
      return;
    }

    await warmupEmbeddingModel(payload.preferred);
    const response: WorkerResponse = {
      id: payload.id,
      ok: true,
      type: "warmup",
      result: { warmed: true },
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id: payload.id,
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Embedding worker request failed",
    };
    self.postMessage(response);
  }
};
