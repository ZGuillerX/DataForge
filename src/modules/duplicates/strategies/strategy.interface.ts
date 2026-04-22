export interface DuplicateMatch {
  recordId: string;
  duplicateOfId: string;
  ruleTriggered: string;
  score: number;
}

export interface DeduplicationStrategy {
  name: string;
  findDuplicates(
    records: Array<{ id: string; data: Record<string, unknown> }>,
  ): DuplicateMatch[];
}
