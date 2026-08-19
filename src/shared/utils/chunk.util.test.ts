import { chunkArray, processInChunks } from './chunk.util';

describe('chunkArray', () => {
  it('splits an array into chunks of the given size', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when size >= array length', () => {
    expect(chunkArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('returns an empty array for an empty input', () => {
    expect(chunkArray([], 5)).toEqual([]);
  });
});

describe('processInChunks', () => {
  it('processes every item across all chunks', async () => {
    const seen: number[] = [];
    await processInChunks([1, 2, 3, 4, 5], 2, async (chunk) => {
      seen.push(...chunk);
    });
    expect(seen).toEqual([1, 2, 3, 4, 5]);
  });

  it('passes the correct offset for each chunk', async () => {
    const offsets: number[] = [];
    await processInChunks([1, 2, 3, 4, 5], 2, async (_chunk, offset) => {
      offsets.push(offset);
    });
    expect(offsets).toEqual([0, 2, 4]);
  });

  it('does not invoke the processor for an empty array', async () => {
    const processor = jest.fn(async () => {});
    await processInChunks([], 10, processor);
    expect(processor).not.toHaveBeenCalled();
  });
});
