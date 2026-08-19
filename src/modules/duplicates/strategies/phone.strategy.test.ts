import { PhoneStrategy } from './phone.strategy';

describe('PhoneStrategy', () => {
  const strategy = new PhoneStrategy();

  it('flags a repeated phone number as a duplicate', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { phone: '555-123-4567' } },
      { id: '2', data: { phone: '555-999-0000' } },
      { id: '3', data: { phone: '5551234567' } },
    ]);

    expect(matches).toEqual([
      { recordId: '3', duplicateOfId: '1', ruleTriggered: 'phone', score: 1.0 },
    ]);
  });

  it('normalizes spaces, dashes, parentheses and plus signs before comparing', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { phone: '+1 (555) 123-4567' } },
      { id: '2', data: { phone: '15551234567' } },
    ]);

    expect(matches).toHaveLength(1);
  });

  it('accepts numeric field values', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { phone: 5551234567 } },
      { id: '2', data: { telefono: '5551234567' } },
    ]);

    expect(matches).toHaveLength(1);
  });

  it('ignores numbers shorter than 7 digits', () => {
    const matches = strategy.findDuplicates([
      { id: '1', data: { phone: '123' } },
      { id: '2', data: { phone: '123' } },
    ]);

    expect(matches).toEqual([]);
  });

  it('ignores records without a phone field', () => {
    const matches = strategy.findDuplicates([{ id: '1', data: { name: 'no phone' } }]);
    expect(matches).toEqual([]);
  });
});
