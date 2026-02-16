"use client";

import {
  AutoModel,
  AutoTokenizer,
  env,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";
import {
  DOCUMENT_PREFIX,
  EMBEDDING_DIM,
  EMBEDDING_MODEL_ID,
  type EmbeddingDtype,
  normalizeVector,
  QUERY_PREFIX,
} from "@/lib/semantic-search";

type ModelBundle = {
  dtype: EmbeddingDtype;
  tokenizer: PreTrainedTokenizer;
  model: PreTrainedModel;
};

let loadedBundlePromise: Promise<ModelBundle> | null = null;
let loadedBundleKey = "";

function getDefaultDtype(): EmbeddingDtype {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    return "q4";
  }
  return "q8";
}

function getDtypeOrder(preferred?: EmbeddingDtype): EmbeddingDtype[] {
  const seed = preferred ?? getDefaultDtype();
  if (seed === "fp32") {
    return ["fp32", "q8", "q4"];
  }
  if (seed === "q8") {
    return ["q8", "q4", "fp32"];
  }
  return ["q4", "q8", "fp32"];
}

async function loadBundle(preferred?: EmbeddingDtype): Promise<ModelBundle> {
  env.allowLocalModels = false;
  const dtypeOrder = getDtypeOrder(preferred);
  let lastError: unknown;

  for (const dtype of dtypeOrder) {
    const cacheKey = `${EMBEDDING_MODEL_ID}:${dtype}`;
    if (loadedBundlePromise && loadedBundleKey === cacheKey) {
      return loadedBundlePromise;
    }

    loadedBundleKey = cacheKey;
    loadedBundlePromise = (async () => {
      const tokenizer = await AutoTokenizer.from_pretrained(EMBEDDING_MODEL_ID);
      const model = await AutoModel.from_pretrained(EMBEDDING_MODEL_ID, {
        dtype,
      });
      return { dtype, tokenizer, model };
    })();

    try {
      return await loadedBundlePromise;
    } catch (error) {
      loadedBundlePromise = null;
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to load embedding model");
}

async function embed(text: string, prefix: string, preferred?: EmbeddingDtype) {
  const bundle = await loadBundle(preferred);
  const inputs = await bundle.tokenizer([`${prefix}${text}`], {
    padding: true,
    truncation: true,
    max_length: 512,
  });
  const output = await bundle.model(inputs);
  const embeddings = output.sentence_embedding.tolist() as number[][];
  const vector = embeddings[0].slice(0, EMBEDDING_DIM);
  return {
    dtype: bundle.dtype,
    vector: normalizeVector(vector),
  };
}

export async function embedBookmarkDocument(
  text: string,
  preferred?: EmbeddingDtype,
) {
  return embed(text, DOCUMENT_PREFIX, preferred);
}

export async function embedBookmarkQuery(
  text: string,
  preferred?: EmbeddingDtype,
) {
  return embed(text, QUERY_PREFIX, preferred);
}
