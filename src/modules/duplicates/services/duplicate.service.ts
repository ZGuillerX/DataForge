import { EmailStrategy } from "../strategies/email.strategy";
import { PhoneStrategy } from "../strategies/phone.strategy";
import { FuzzyStrategy } from "../strategies/fuzzy.strategy";
import { DuplicatesRepository } from "../repositories/duplicates.repository";
import { RecordsRepository } from "../../records/repositories/records.repository";
import type { DuplicateMatch } from "../strategies/strategy.interface";

type RuleName = "email" | "phone" | "fuzzy";

export class DuplicateService {
  private strategies = {
    email: new EmailStrategy(),
    phone: new PhoneStrategy(),
    fuzzy: new FuzzyStrategy(),
  };
  private dupRepo = new DuplicatesRepository();
  private recordsRepo = new RecordsRepository();

  async detectAndSave(jobId: string, rules: RuleName[]): Promise<number> {
    const records = await this.recordsRepo.findValidByJobId(jobId);

    const allMatches: DuplicateMatch[] = [];

    for (const rule of rules) {
      const strategy = this.strategies[rule];
      if (!strategy) continue;
      const matches = strategy.findDuplicates(
        records.map((r: { id: string; data: unknown }) => ({
          id: r.id,
          data: r.data as Record<string, unknown>,
        })),
      );
      allMatches.push(...matches);
    }

    // Deduplicar los propios matches para no repetir
    const uniqueMatches = this.deduplicateMatches(allMatches);

    if (uniqueMatches.length > 0) {
      await this.dupRepo.bulkCreate(uniqueMatches);
      await Promise.all(
        uniqueMatches.map((m) => this.recordsRepo.markAsDuplicate(m.recordId)),
      );
    }

    return uniqueMatches.length;
  }

  private deduplicateMatches(matches: DuplicateMatch[]): DuplicateMatch[] {
    const seen = new Set<string>();
    return matches.filter((m) => {
      const key = m.recordId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
