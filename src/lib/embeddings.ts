const EMBEDDING_MODEL = "text-embedding-3-small";
/** Category names are a word or two, so a short vector loses nothing that matters. */
const EMBEDDING_DIMENSIONS = 256;

/**
 * Embed a batch of short texts with a multilingual model, in one request.
 * @param {String[]} texts - Texts to embed
 * @returns {Promise<number[][] | null>} - One vector per text, in order, or null
 * when embeddings are unavailable (no API key, network or upstream error).
 * Callers treat null as "no meaning-based signal", never as a failure.
 */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  if (!texts.length) return [];
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        input: texts,
      }),
    });
    if (!response.ok) {
      console.error("Embedding request failed:", response.status);
      return null;
    }
    const json: { data: { index: number; embedding: number[] }[] } =
      await response.json();
    const vectors: number[][] = new Array(texts.length);
    for (const item of json.data) vectors[item.index] = item.embedding;
    return vectors.every(Array.isArray) ? vectors : null;
  } catch (error) {
    console.error("Embedding request failed:", error);
    return null;
  }
}

/**
 * Cosine similarity of two vectors of equal length; 0 when either is empty.
 */
export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}
