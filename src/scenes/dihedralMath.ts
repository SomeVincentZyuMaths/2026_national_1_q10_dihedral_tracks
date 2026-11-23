export const TRACKS = {
  radiusC: 2,
  radiusD: 1,
  dihedralDegrees: 60,
  abLength: 10,
  axialC: 4.8,
  axialDStart: 1.6,
  axialDEnd: 4.8,
} as const;

export function radialSeparationSquared(): number {
  return (
    TRACKS.radiusC ** 2 +
    TRACKS.radiusD ** 2 -
    2 * TRACKS.radiusC * TRACKS.radiusD * Math.cos((TRACKS.dihedralDegrees * Math.PI) / 180)
  );
}

export function pointC(axial: number): [number, number, number] {
  return [0, axial, TRACKS.radiusC];
}

export function pointD(axial: number): [number, number, number] {
  const angle = (TRACKS.dihedralDegrees * Math.PI) / 180;
  return [TRACKS.radiusD * Math.sin(angle), axial, TRACKS.radiusD * Math.cos(angle)];
}

export function distanceCD(axialC: number, axialD: number): number {
  const c = pointC(axialC);
  const d = pointD(axialD);
  return Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]);
}

export function minimumDistance(): number {
  return Math.sqrt(radialSeparationSquared());
}

export function planeABDResidual(point: [number, number, number]): number {
  return point[0] - Math.sqrt(3) * point[2];
}

export function abPerpendicularCD(axialC: number, axialD: number): boolean {
  return Math.abs(axialC - axialD) < 1e-10;
}

export function cdDotAD(axialC: number, axialD: number): number {
  const c = pointC(axialC);
  const d = pointD(axialD);
  return (c[0] - d[0]) * d[0] + (c[1] - d[1]) * d[1] + (c[2] - d[2]) * d[2];
}
