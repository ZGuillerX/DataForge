import { FuzzyStrategy } from './fuzzy.strategy';

describe('FuzzyStrategy', () => {
  const strategy = new FuzzyStrategy();

  it('flags records with the exact same name as duplicates', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { name: 'John Smith' } },
      { id: '2', data: { name: 'Maria Garcia' } },
      { id: '3', data: { name: 'John Smith' } },
    ]);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      recordId: '3',
      duplicateOfId: '1',
      ruleTriggered: 'fuzzy',
    });
    expect(matches[0].score).toBeGreaterThanOrEqual(0.85);
  });

  it('does not flag clearly unrelated names', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { name: 'John Smith' } },
      { id: '2', data: { name: 'Maria Garcia' } },
    ]);

    expect(matches).toEqual([]);
  });

  it('is case-insensitive and trims whitespace', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { name: '  JOHN SMITH  ' } },
      { id: '2', data: { name: 'john smith' } },
    ]);

    expect(matches).toHaveLength(1);
  });

  it('recognizes an alternate field name (nombre) when used consistently', () => {
    // detectNameField infers the field from the first record only, so it
    // expects the same column across records — matching a real CSV import
    // where every row shares the same headers.
    const matches = strategy.findDuplicates([
      { id: '1', data: { nombre: 'Ana Torres' } },
      { id: '2', data: { nombre: 'Ana Torres' } },
    ]);

    expect(matches).toHaveLength(1);
  });

  it('returns no matches when no record has a recognizable name field', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { email: 'a@test.com' } },
      { id: '2', data: { email: 'b@test.com' } },
    ]);

    expect(matches).toEqual([]);
  });

  it('does not match a record against itself and does not double-count', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { name: 'Same Name' } },
      { id: '2', data: { name: 'Same Name' } },
      { id: '3', data: { name: 'Same Name' } },
    ]);

    const ids = matches.map((m) => m.recordId).sort();
    expect(ids).toEqual(['2', '3']);
  });
});
