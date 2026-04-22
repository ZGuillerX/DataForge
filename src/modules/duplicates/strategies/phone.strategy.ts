import type {
  DeduplicationStrategy,
  DuplicateMatch,
} from "./strategy.interface";

export class PhoneStrategy implements DeduplicationStrategy {
  name = "phone";

  findDuplicates(
    records: Array<{ id: string; data: Record<string, unknown> }>,
  ): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];
    const seen = new Map<string, string>(); // phone -> recordId

    for (const record of records) {
      const phone = this.extractPhone(record.data);
      if (!phone) continue;

      const existing = seen.get(phone);
      if (existing) {
        matches.push({
          recordId: record.id,
          duplicateOfId: existing,
          ruleTriggered: "phone",
          score: 1.0,
        });
      } else {
        seen.set(phone, record.id);
      }
    }

    return matches;
  }

  private extractPhone(data: Record<string, unknown>): string | null {
    const phoneFields = [
      "phone",
      "Phone",
      "PHONE",
      "telefono",
      "tel",
      "mobile",
    ];
    for (const field of phoneFields) {
      const val = data[field];
      if (typeof val === "string" || typeof val === "number") {
        const normalized = String(val).replace(/[\s\-\(\)\+]/g, "");
        if (normalized.length >= 7) return normalized;
      }
    }
    return null;
  }
}
