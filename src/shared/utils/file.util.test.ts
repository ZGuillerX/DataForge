import {
  generateUniqueFilename,
  getFileExtension,
  isSupportedImportFormat,
  bytesToMB,
} from './file.util';

describe('generateUniqueFilename', () => {
  it('keeps the original extension', () => {
    expect(generateUniqueFilename('report.CSV')).toMatch(/\.CSV$/);
  });

  it('sanitizes non-alphanumeric characters from the base name', () => {
    const result = generateUniqueFilename('my report (final)!.csv');
    const base = result.replace(/\.csv$/, '');
    expect(base).toMatch(/^\d+_[a-f0-9]{8}_my_report__final__$/);
  });

  it('produces different names for repeated calls with the same input', () => {
    const a = generateUniqueFilename('same.csv');
    const b = generateUniqueFilename('same.csv');
    expect(a).not.toEqual(b);
  });
});

describe('getFileExtension', () => {
  it('returns the lowercase extension without the dot', () => {
    expect(getFileExtension('DATA.XLSX')).toBe('xlsx');
  });

  it('returns an empty string when there is no extension', () => {
    expect(getFileExtension('README')).toBe('');
  });
});

describe('isSupportedImportFormat', () => {
  it.each(['file.csv', 'file.xlsx', 'file.xls', 'FILE.CSV'])('accepts %s', (name) => {
    expect(isSupportedImportFormat(name)).toBe(true);
  });

  it.each(['file.pdf', 'file.txt', 'file'])('rejects %s', (name) => {
    expect(isSupportedImportFormat(name)).toBe(false);
  });
});

describe('bytesToMB', () => {
  it('converts bytes to megabytes', () => {
    expect(bytesToMB(1024 * 1024)).toBe(1);
    expect(bytesToMB(5 * 1024 * 1024)).toBe(5);
  });
});
