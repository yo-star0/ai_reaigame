import { phaseFromAffinity, buildPhaseInstruction } from './relationship-phase';

describe('phaseFromAffinity', () => {
  it('cold at extreme negative', () => {
    expect(phaseFromAffinity(-50).key).toBe('cold');
  });
  it('awkward below zero', () => {
    expect(phaseFromAffinity(-5).key).toBe('awkward');
  });
  it('acquaintance at 0..14', () => {
    expect(phaseFromAffinity(0).key).toBe('acquaintance');
    expect(phaseFromAffinity(14).key).toBe('acquaintance');
  });
  it('curious at 15..39', () => {
    expect(phaseFromAffinity(15).key).toBe('curious');
    expect(phaseFromAffinity(39).key).toBe('curious');
  });
  it('close at 40..69', () => {
    expect(phaseFromAffinity(40).key).toBe('close');
    expect(phaseFromAffinity(69).key).toBe('close');
  });
  it('intimate at 70+', () => {
    expect(phaseFromAffinity(70).key).toBe('intimate');
    expect(phaseFromAffinity(100).key).toBe('intimate');
  });
});

describe('buildPhaseInstruction', () => {
  it('includes phase label and affinity', () => {
    const out = buildPhaseInstruction(50);
    expect(out).toContain('親しい');
    expect(out).toContain('affinity=50');
  });
});
