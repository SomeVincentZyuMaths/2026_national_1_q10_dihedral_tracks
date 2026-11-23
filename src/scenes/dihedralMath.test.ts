import { describe, expect, it } from 'vitest';
import {
  abPerpendicularCD,
  cdDotAD,
  distanceCD,
  minimumDistance,
  planeABDResidual,
  pointD,
  radialSeparationSquared,
} from './dihedralMath';

describe('dihedral track geometry', () => {
  it('has the expected radial minimum', () => {
    expect(radialSeparationSquared()).toBeCloseTo(3, 10);
    expect(minimumDistance()).toBeCloseTo(Math.sqrt(3), 10);
  });

  it('grows quadratically with axial separation', () => {
    const d = distanceCD(-3, 2);
    expect(d * d).toBeCloseTo(3 + 25, 10);
  });

  it('uses x = sqrt(3) z as the plane ABD', () => {
    expect(planeABDResidual([0, 0, 0])).toBeCloseTo(0, 10);
    expect(planeABDResidual([0, 10, 0])).toBeCloseTo(0, 10);
    expect(planeABDResidual(pointD(4.8))).toBeCloseTo(0, 10);
  });

  it('makes CD perpendicular to AD when the y coordinates match', () => {
    expect(abPerpendicularCD(4.8, 4.8)).toBe(true);
    expect(cdDotAD(4.8, 4.8)).toBeCloseTo(0, 10);
    expect(cdDotAD(4.8, 1.6)).not.toBeCloseTo(0, 3);
  });
});
