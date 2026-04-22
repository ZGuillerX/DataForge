/**
 * Divide un array en chunks de tamaño `size`
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Procesa un array por chunks con un callback async.
 * Permite trackear progreso sin cargar todo en memoria.
 */
export async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  processor: (chunk: T[], offset: number) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processor(chunk, i);
  }
}
