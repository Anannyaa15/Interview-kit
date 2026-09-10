import { describe, expect, it } from 'vitest';
import { validateKitStructure } from '../structure.service.js';

const base: any = {
  source: {},
  company_brief: { summary: '', what_they_do: '', sources: [] },
  role: { title: '', seniority: '', responsibilities: [], requirements: [
    { id: 'r1', text: 'React', kind: 'technical', priority: 'must' }
  ] },
  questions: [{ id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Explain React.', answer_outline: '...', difficulty: 2 }],
  flashcards: [{ id: 'f1', front: 'React?', back: 'Library', requirement_ids: ['r1'] }],
  schedule: { days_available: 1, days: [{ day: 1, focus: 'React', question_ids: ['q1'], minutes: 30 }] },
  coverage: { uncovered_requirement_ids: [], passes: 1 }
};

describe('validateKitStructure', () => {
  it('accepts a valid kit', () => expect(validateKitStructure(base).valid).toBe(true));
  it('rejects duplicate requirement ids', () => {
    const kit = structuredClone(base);
    kit.role.requirements.push({ id: 'r1', text: 'Node', kind: 'technical', priority: 'nice' });
    expect(validateKitStructure(kit).errors.some(e => e.includes('Duplicate requirement id'))).toBe(true);
  });
  it('rejects missing must-have coverage', () => {
    const kit = structuredClone(base);
    kit.coverage.uncovered_requirement_ids = ['r1'];
    expect(validateKitStructure(kit).errors.some(e => e.includes('uncovered must-have'))).toBe(true);
  });
  it('rejects non-integer minutes', () => {
    const kit = structuredClone(base);
    kit.schedule.days[0].minutes = 20.5;
    expect(validateKitStructure(kit).errors.some(e => e.includes('integer'))).toBe(true);
  });
});
