import type { DeduplicationStrategy, DuplicateMatch } from './strategy.interface';

export class EmailStrategy implements DeduplicationStrategy {
  name = 'email';

  findDuplicates(records: Array<{ id: string; data: Record<string, unknown> }>): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];
    const seen = new Map<string, string>(); // email -> recordId

    for (const record of records) {
      const email = this.extractEmail(record.data);
      if (!email) continue;

      const existing = seen.get(email);
      if (existing) {
        matches.push({
          recordId: record.id,
          duplicateOfId: existing,
          ruleTriggered: 'email',
          score: 1.0,
        });
      } else {
        seen.set(email, record.id);
      }
    }

    return matches;
  }

  private extractEmail(data: Record<string, unknown>): string | null {
    const emailFields = ['email', 'Email', 'EMAIL', 'correo', 'mail'];
    for (const field of emailFields) {
      const val = data[field];
      if (typeof val === 'string' && val.includes('@')) {
        return val.trim().toLowerCase();
      }
    }
    return null;
  }
}
