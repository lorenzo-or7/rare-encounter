import { hexToHslTriplet } from './glow-color';

describe('hexToHslTriplet', () => {
  it('converts theme hex tokens to the "H S L" form Border Glow parses', () => {
    expect(hexToHslTriplet('#ff0000')).toBe('0 100 50');
    expect(hexToHslTriplet('#fff')).toBe('0 0 100');
    // Spectrum accent
    expect(hexToHslTriplet('#a78bfa')).toBe('255.1 91.7 76.3');
  });

  it('returns null for values it cannot read, so the default glow is kept', () => {
    expect(hexToHslTriplet('rgb(1, 2, 3)')).toBeNull();
    expect(hexToHslTriplet('')).toBeNull();
  });
});
