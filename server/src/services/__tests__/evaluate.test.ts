import { describe, expect, it } from 'vitest';
import { validateInput } from '../../evaluate.js';

describe('batch input validation', () => {
  it('accepts a valid case', () => {
    expect(validateInput({ id: 'case-01', jd: 'Engineer', company_url: 'https://example.com', days: 5 })).toBe(true);
  });

  it('rejects missing or invalid fields', () => {
    expect(validateInput({ id: 'case-01', jd: '', company_url: 'https://example.com', days: 5 })).toBe(false);
    expect(validateInput({ id: 'case-01', jd: 'Engineer', company_url: 'ftp://example.com', days: 5 })).toBe(false);
    expect(validateInput({ id: 'case-01', jd: 'Engineer', company_url: 'https://example.com', days: 0 })).toBe(false);
  });
});
