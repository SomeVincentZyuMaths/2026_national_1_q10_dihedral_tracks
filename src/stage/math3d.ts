import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export const vec = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const easeInOut = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export function makeLine(
  points: THREE.Vector3[],
  color: string,
  width = 2,
  options: { opacity?: number; dashed?: boolean; dashSize?: number; gapSize?: number } = {},
): Line2 {
  const geometry = new LineGeometry();
  geometry.setPositions(points.flatMap((point) => [point.x, point.y, point.z]));
  const material = new LineMaterial({
    color,
    linewidth: width,
    transparent: true,
    opacity: options.opacity ?? 1,
    dashed: options.dashed ?? false,
    dashSize: options.dashSize ?? 0.12,
    gapSize: options.gapSize ?? 0.08,
    depthTest: true,
    toneMapped: false,
  });
  material.resolution.set(1, 1);
  const line = new Line2(geometry, material);
  line.computeLineDistances();
  return line;
}

export function makeLoop(points: THREE.Vector3[], color: string, width = 2, opacity = 1): Line2 {
  return makeLine([...points, points[0]], color, width, { opacity });
}

export function makeDashed(a: THREE.Vector3, b: THREE.Vector3, color: string, width = 1.4): Line2 {
  return makeLine([a, b], color, width, { dashed: true, dashSize: 0.12, gapSize: 0.09 });
}

export function circlePoints(
  center: THREE.Vector3,
  radius: number,
  normal: THREE.Vector3,
  segments = 96,
): THREE.Vector3[] {
  const n = normal.clone().normalize();
  const helper = Math.abs(n.y) > 0.92 ? vec(1, 0, 0) : vec(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(helper, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * Math.PI * 2;
    return center
      .clone()
      .addScaledVector(u, radius * Math.cos(angle))
      .addScaledVector(v, radius * Math.sin(angle));
  });
}

export function makeLabel(text: string, className = ''): CSS2DObject {
  const element = document.createElement('div');
  element.className = `p3d-label ${className}`.trim();
  element.textContent = text;
  return new CSS2DObject(element);
}

export function makePanel(width: number, height: number, color: string, opacity: number): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

export function setOpacity(object: THREE.Object3D, opacity: number): void {
  object.visible = opacity > 0.001;
  object.traverse((child) => {
    const material = (child as THREE.Mesh).material;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const item of list) {
      if ('opacity' in item) item.opacity = opacity;
    }
  });
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (!material) return;
    const list = Array.isArray(material) ? material : [material];
    for (const item of list) item.dispose();
  });
}

export function lerpVector(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return a.clone().lerp(b, THREE.MathUtils.clamp(t, 0, 1));
}
