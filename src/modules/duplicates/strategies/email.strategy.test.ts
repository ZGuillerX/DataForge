import { EmailStrategy } from './email.strategy';

describe('EmailStrategy', () => {
  const strategy = new EmailStrategy();

  it('flags the second record with a repeated email as a duplicate of the first', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { email: 'a@test.com' } },
      { id: '2', data: { email: 'b@test.com' } },
      { id: '3', data: { email: 'a@test.com' } },
    ]);

    expect(matches).toEqual([
      { recordId: '3', duplicateOfId: '1', ruleTriggered: 'email', score: 1.0 },
    ]);
  });

  it('is case-insensitive and trims whitespace', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { email: '  A@Test.com  ' } },
      { id: '2', data: { email: 'a@test.com' } },
    ]);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ recordId: '2', duplicateOfId: '1' });
  });

  it('recognizes alternate field names (Email, correo, mail)', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { correo: 'x@test.com' } },
      { id: '2', data: { Email: 'x@test.com' } },
    ]);

    expect(matches).toHaveLength(1);
  });

  it('ignores records without a valid email field', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { name: 'no email here' } },
      { id: '2', data: { email: 'not-an-email' } },
    ]);

    expect(matches).toEqual([]);
  });

  it('returns no matches when every email is unique', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { email: 'a@test.com' } },
      { id: '2', data: { email: 'b@test.com' } },
    ]);

    expect(matches).toEqual([]);
  });
});
