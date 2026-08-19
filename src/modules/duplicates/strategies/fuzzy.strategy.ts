import Fuse from 'fuse.js';
import type { DeduplicationStrategy, DuplicateMatch } from './strategy.interface';

const FUZZY_THRESHOLD = 0.85; // similitud mínima para marcar como duplicado

export class FuzzyStrategy implements DeduplicationStrategy {
  name = 'fuzzy';

  findDuplicates(records: Array<{ id: string; data: Record<string, unknown> }>): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];
    const nameField = this.detectNameField(records[0]?.data ?? {});
    if (!nameField) return matches;

    const items = records.map((r) => ({
      id: r.id,
      name: String(r.data[nameField] ?? '')
        .toLowerCase()
        .trim(),
    }));

    const fuse = new Fuse(items, {
      keys: ['name'],
      includeScore: true,
      threshold: 1 - FUZZY_THRESHOLD,
      minMatchCharLength: 3,
    });

    const seen = new Set<string>();

    for (const item of items) {
      if (seen.has(item.id) || !item.name) continue;

      const results = fuse.search(item.name);
      for (const result of results) {
        if (result.item.id === item.id) continue;
        if (seen.has(result.item.id)) continue;

        const similarity = 1 - (result.score ?? 1);
        if (similarity >= FUZZY_THRESHOLD) {
          matches.push({
            recordId: result.item.id,
            duplicateOfId: item.id,
            ruleTriggered: 'fuzzy',
            score: similarity,
          });
          seen.add(result.item.id);
        }
      }
      seen.add(item.id);
    }

    return matches;
  }

  private detectNameField(data: Record<string, unknown>): string | null {
    const nameFields = ['name', 'Name', 'NAME', 'nombre', 'full_name', 'fullName'];
    for (const field of nameFields) {
      if (field in data) return field;
    }
    return null;
  }
}
