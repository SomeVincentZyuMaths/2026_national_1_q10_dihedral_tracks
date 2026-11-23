import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import {
  circlePoints,
  disposeObject,
  easeInOut,
  makeLabel,
  makeLine,
  makeLoop,
  setOpacity,
  vec,
} from '../stage/math3d';
import { getThemeColors, type ThemeColors } from '../stage/theme';
import type { CameraMode, SceneContext, SceneController, ThemeName } from '../stage/types';
import { distanceCD, pointC, pointD, TRACKS } from './dihedralMath';
import { createProofDrawing } from './proofDrawing';

const near = TRACKS.axialDStart, far = TRACKS.axialC;
const oblique = { position: vec(13.5, 6, 10.5), target: vec(5, 0, 0) };
const endOn = { position: vec(15, 0.8, 0), target: vec(far, 0.8, 0) };
const close = { position: vec(8, 4, 8), target: vec(2, 0.9, 0) };
const CAMERA_VIEWS = [oblique, oblique, endOn, oblique, oblique, endOn, oblique, close, close, oblique];
const ramp = (p: number, a: number, b: number) => easeInOut(THREE.MathUtils.clamp((p-a)/(b-a), 0, 1));
function lessonState(index: number, p: number) {
  const blend = ramp(p, 0, 0.12);
  const weight = (...steps: number[]) => THREE.MathUtils.lerp(Number(steps.includes(Math.max(0,index-1))), Number(steps.includes(index)), blend);
  let axialC: number = far, axialD: number = near;
  if (index === 3) axialD = THREE.MathUtils.lerp(near, far, ramp(p, .40, .77));
  if (index === 4) axialD = far - (far-near) * (ramp(p, .05, .28) - ramp(p, .49, .77));
  if (index >= 5) axialD = axialC;
  if (index === 7) axialD = axialC = THREE.MathUtils.lerp(far, Math.SQRT2, ramp(p, .06, .47));
  if (index === 8) axialD = axialC = Math.SQRT2 * (1-ramp(p, .06, .50));
  if (index === 9) { axialC = far*ramp(p, .05, .56); axialD = near*ramp(p, .05, .56); }
  return { index, p, axialC, axialD, weight, inset: weight(2,5), plane: weight(6), highlight: weight(2,3,4,5,6,7,8) };
}
type TrackState = ReturnType<typeof lessonState>;

function makeTube(radius: number, length: number, color: string): { group: THREE.Group; material: THREE.MeshBasicMaterial } {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.075,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  material.userData.colorRole = 'blue';
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 64, 1, true), material);
  mesh.rotation.z = Math.PI / 2;
  group.add(mesh);
  return { group, material };
}

function updateLine(line: Line2, a: THREE.Vector3, b: THREE.Vector3): void {
  line.geometry.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
  line.computeLineDistances();
}

function toWorld([x, y, z]: [number, number, number]): THREE.Vector3 {
  return vec(y, z, x); // 数学坐标 (x,y,z) → Three.js 世界坐标 (y,z,x)
}

export function createScene({ host, canvas }: SceneContext): SceneController {
  const scene = new THREE.Scene();
  // Parallel projection keeps world-vertical lines vertical even away from screen center.
  const camera = new THREE.OrthographicCamera(-5.6, 5.6, 5.6, -5.6, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
  controls.minZoom = 0.5;
  controls.maxZoom = 3;
  controls.target.copy(CAMERA_VIEWS[0].target);
  camera.position.copy(CAMERA_VIEWS[0].position);

  let theme: ThemeColors = getThemeColors();
  let state = lessonState(0, 0);
  let cameraTween = 0;
  let cameraFrom = camera.position.clone();
  let targetFrom = controls.target.clone();
  let cameraTo = CAMERA_VIEWS[0].position.clone();
  let targetTo = CAMERA_VIEWS[0].target.clone();
  const initialDistance = camera.position.distanceTo(controls.target);
  let zoomFrom = camera.zoom;
  let zoomTo = camera.zoom;

  controls.addEventListener('start', () => {
    cameraTween = 1;
  });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x526273, 2.1));
  const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
  mainLight.position.set(7, 12, 10);
  scene.add(mainLight);

  const origin = vec(0, 0, 0);
  const pointB = vec(TRACKS.abLength, 0, 0);
  const axis = makeLine([origin, pointB], theme.gold, 3.4, {
    opacity: 0.82,
  });
  axis.material.userData.colorRole = 'gold';
  scene.add(axis);
  const endpointMaterial = new THREE.MeshStandardMaterial({ color: theme.gold, roughness: 0.22, metalness: 0.2 });
  endpointMaterial.userData.colorRole = 'gold';
  for (const x of [origin.x, pointB.x]) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 24, 18),
      endpointMaterial,
    );
    marker.position.x = x;
    scene.add(marker);
  }

  function addAxisGuide(name: 'x' | 'y' | 'z', role: 'gold' | 'teal' | 'blue', start: THREE.Vector3, tip: THREE.Vector3) {
    const direction = tip.clone().sub(start).normalize();
    const headLength = 0.23;
    const base = tip.clone().addScaledVector(direction, -headLength);
    const dashed = name === 'y';
    const shaft = makeLine([start, base], theme[role], dashed ? 1.4 : 1.7, { opacity: dashed ? 0.55 : 0.46, dashed });
    shaft.material.userData.colorRole = role;
    const material = new THREE.MeshBasicMaterial({ color: theme[role], toneMapped: false });
    material.userData.colorRole = role;
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, headLength, 20), material);
    head.quaternion.setFromUnitVectors(vec(0, 1, 0), direction);
    head.position.copy(base).addScaledVector(direction, headLength / 2);

    const label = makeLabel(name, role);
    label.position.copy(tip);
    // Screen-space offsets keep axis labels beside the tips as the camera rotates.
    label.element.style.margin = name === 'z' ? '-14px 0 0' : '14px 0 0 12px';
    scene.add(shaft, head, label);
  }

  addAxisGuide('x', 'gold', origin, vec(0, 0, 4.2));
  addAxisGuide('z', 'teal', origin, vec(0, 4.2, 0));
  addAxisGuide('y', 'blue', pointB, vec(TRACKS.abLength + 0.6, 0, 0));

  const yOzPlaneMaterial = new THREE.MeshBasicMaterial({
    color: theme.blue,
    transparent: true,
    opacity: 0.035,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  yOzPlaneMaterial.userData.colorRole = 'blue';
  const yOzPlane = new THREE.Mesh(new THREE.PlaneGeometry(TRACKS.abLength, 4.2), yOzPlaneMaterial);
  yOzPlane.position.set(TRACKS.abLength / 2, 2.1, 0);
  scene.add(yOzPlane);

  const yOzGrid = new THREE.GridHelper(TRACKS.abLength, 10, theme.grid, theme.grid);
  yOzGrid.rotation.x = Math.PI / 2;
  yOzGrid.position.set(TRACKS.abLength / 2, 2.1, 0);
  yOzGrid.scale.z = 0.42;
  const yOzGridMaterial = yOzGrid.material as THREE.LineBasicMaterial;
  yOzGridMaterial.transparent = true;
  yOzGridMaterial.opacity = 0.16;
  yOzGridMaterial.depthWrite = false;
  scene.add(yOzGrid);

  const yOzLabel = makeLabel('yOz', 'blue');
  yOzLabel.position.set(9.3, 3.35, 0);
  scene.add(yOzLabel);

  const sectionPlaneMaterial = new THREE.MeshBasicMaterial({
    color: theme.teal,
    transparent: true,
    opacity: 0.055,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  sectionPlaneMaterial.userData.colorRole = 'teal';
  const sectionPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), sectionPlaneMaterial);
  sectionPlane.rotation.y = Math.PI / 2;
  sectionPlane.position.set(TRACKS.axialC, 0, 0);
  scene.add(sectionPlane);

  const sectionBorder = makeLoop(
    [
      vec(TRACKS.axialC, -2.2, -2.2),
      vec(TRACKS.axialC, 2.2, -2.2),
      vec(TRACKS.axialC, 2.2, 2.2),
      vec(TRACKS.axialC, -2.2, 2.2),
    ],
    theme.teal,
    1.5,
    0.34,
  );
  sectionBorder.material.userData.colorRole = 'teal';
  scene.add(sectionBorder);

  const sectionLabel = makeLabel('y=y_C ∥ xOz', 'teal');
  sectionLabel.position.set(TRACKS.axialC + 0.08, 2.75, 2.15);
  scene.add(sectionLabel);

  const oPrimeMaterial = new THREE.MeshStandardMaterial({ color: theme.gold, roughness: 0.22, metalness: 0.2 });
  oPrimeMaterial.userData.colorRole = 'gold';
  const oPrime = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 18), oPrimeMaterial);
  oPrime.position.set(TRACKS.axialC, 0, 0);
  const centerD = oPrime.clone(); scene.add(oPrime, centerD);
  const labelO1 = makeLabel('O₁', 'blue');
  labelO1.position.set(TRACKS.axialC - 0.28, -0.24, 0.28);
  const labelO2 = makeLabel('O₂', 'teal');
  scene.add(labelO1, labelO2);

  const tubeC = makeTube(TRACKS.radiusC, 3.2, theme.blue);
  const tubeD = makeTube(TRACKS.radiusD, 3.2, theme.teal);
  tubeD.material.userData.colorRole = 'teal';
  scene.add(tubeC.group, tubeD.group);

  const ringC = makeLoop(circlePoints(vec(0, 0, 0), TRACKS.radiusC, vec(1, 0, 0)), theme.blue, 2.1, 0.86);
  ringC.material.userData.colorRole = 'blue';
  scene.add(ringC);
  const ringD = makeLoop(circlePoints(vec(0, 0, 0), TRACKS.radiusD, vec(1, 0, 0)), theme.teal, 2.1, 0.88);
  ringD.material.userData.colorRole = 'teal';
  scene.add(ringD);

  const sphereMaterialC = new THREE.MeshStandardMaterial({ color: theme.blue, roughness: 0.25, metalness: 0.15 });
  sphereMaterialC.userData.colorRole = 'blue';
  const sphereC = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 18), sphereMaterialC);
  scene.add(sphereC);
  const sphereMaterialD = new THREE.MeshStandardMaterial({ color: theme.teal, roughness: 0.25, metalness: 0.15 });
  sphereMaterialD.userData.colorRole = 'teal';
  const sphereD = new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 18), sphereMaterialD);
  scene.add(sphereD);

  const radialC = makeLine([vec(TRACKS.axialC, 0, 0), toWorld(pointC(TRACKS.axialC))], theme.blue, 1.5, {
    opacity: 0.58,
    dashed: true,
  });
  radialC.material.userData.colorRole = 'blue';
  scene.add(radialC);
  const radialD = makeLine([vec(TRACKS.axialDStart, 0, 0), toWorld(pointD(TRACKS.axialDStart))], theme.teal, 1.5, {
    opacity: 0.58,
    dashed: true,
  });
  radialD.material.userData.colorRole = 'teal';
  scene.add(radialD);

  const cdLine = makeLine([toWorld(pointC(TRACKS.axialC)), toWorld(pointD(TRACKS.axialDStart))], theme.red, 3.6, {
    opacity: 0.92,
  });
  cdLine.material.userData.colorRole = 'red';
  scene.add(cdLine);

  const planeGeometry = new THREE.BufferGeometry();
  planeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
  planeGeometry.setIndex([0, 1, 2]);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: theme.red,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  planeMaterial.userData.colorRole = 'red';
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(planeMesh);

  const labelC = makeLabel('C(0,y_C,2)', 'blue');
  const labelD = makeLabel('D(√3/2,y_D,½)', 'teal');
  const labelDistance = makeLabel('CD', 'accent');
  const labelA = makeLabel('A', 'gold');
  const labelB = makeLabel('B', 'gold');
  const labelPlaneABD = makeLabel('平面 ABD', 'accent');
  labelA.position.set(-0.28, 0.24, 0);
  labelB.position.set(TRACKS.abLength + 0.3, 0.24, 0);
  scene.add(labelA, labelB, labelC, labelD, labelDistance, labelPlaneABD);

  const inset = document.createElement('div');
  inset.className = 'tracks-inset';
  inset.innerHTML = `
    <div class="tracks-inset-title">沿 AB 看过去</div>
    <svg viewBox="0 0 320 300" aria-hidden="true">
      <g transform="rotate(-90 150 156)">
        <circle cx="150" cy="156" r="120" fill="none" stroke="var(--blue)" stroke-width="2" opacity="0.75"/>
        <circle cx="150" cy="156" r="60" fill="none" stroke="var(--teal)" stroke-width="2" opacity="0.8"/>
        <line x1="150" y1="156" x2="270" y2="156" stroke="var(--blue)" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.6"/>
        <line x1="150" y1="156" x2="180" y2="104" stroke="var(--teal)" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.65"/>
        <line x1="270" y1="156" x2="180" y2="104" stroke="var(--red)" stroke-width="4" stroke-linecap="round"/>
        <path d="M 204 156 A 54 54 0 0 0 177 109" fill="none" stroke="var(--gold)" stroke-width="2"/>
        <path data-inset-right d="M 191.3 110.5 l -6.5 11.3 -11.3 -6.5" fill="none" stroke="var(--red)" stroke-width="1.6"/>
        <circle cx="150" cy="156" r="4" fill="var(--gold)"/>
        <circle cx="270" cy="156" r="6" fill="var(--blue)"/>
        <circle cx="180" cy="104" r="6" fill="var(--teal)"/>
      </g>
      <line x1="150" y1="156" x2="150" y2="52" stroke="var(--teal)" stroke-width="1.2" marker-end="url(#axis-z)"/>
      <line x1="150" y1="156" x2="48" y2="156" stroke="var(--gold)" stroke-width="1.2" marker-end="url(#axis-x)"/>
      <defs>
        <marker id="axis-z" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--teal)"/></marker>
        <marker id="axis-x" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="var(--gold)"/></marker>
      </defs>
      <text x="143" y="25" fill="var(--blue)">C</text>
      <text x="82" y="121" fill="var(--teal)" data-inset-d>D</text>
      <text x="108" y="76" fill="var(--red)">√3</text>
      <text x="132" y="111" fill="var(--gold)">60°</text>
      <text x="158" y="172" fill="var(--blue)">O₁</text>
      <text x="158" y="190" fill="var(--teal)">O₂</text>
      <text x="155" y="45" fill="var(--teal)">z</text>
      <text x="36" y="161" fill="var(--gold)">x</text>
    </svg>
  `;
  host.appendChild(inset);
  const insetD = inset.querySelector('[data-inset-d]')!;
  const insetRight = inset.querySelector<SVGElement>('[data-inset-right]')!;
  const insetLength = inset.querySelector<SVGElement>('text[fill="var(--red)"]')!;

  const drawProof = createProofDrawing(scene,theme);
  const c = new THREE.Vector3();
  const d = new THREE.Vector3();

  function updatePlane(axial: number): void {
    const positions = planeGeometry.getAttribute('position') as THREE.BufferAttribute;
    positions.setXYZ(0, origin.x, origin.y, origin.z);
    positions.setXYZ(1, pointB.x, pointB.y, pointB.z);
    positions.setXYZ(2, axial, 0.5, Math.sqrt(3) / 2);
    positions.needsUpdate = true;
    planeGeometry.computeVertexNormals();
  }

  function applyState(next: TrackState): void {
    state = next;
    const axialC = next.axialC;
    const shift = axialC - TRACKS.axialC;
    oPrime.position.x = sectionPlane.position.x = axialC;
    sectionBorder.position.x = shift;
    sectionLabel.position.x = axialC + 0.08;
    c.copy(toWorld(pointC(axialC)));
    d.copy(toWorld(pointD(next.axialD)));
    tubeC.group.position.x = axialC;
    tubeD.group.position.x = next.axialD;
    ringC.position.x = axialC;
    ringD.position.x = next.axialD;
    labelO1.position.set(axialC - 0.28, -0.24, 0.28);
    labelO2.position.set(next.axialD + 0.12, -0.24, 0.28);
    const merged = Math.abs(next.axialD-axialC) < .002;
    const atA = merged && axialC < .002;
    centerD.position.set(next.axialD,0,0); centerD.visible = !merged;
    labelO1.element.textContent = next.index === 2 ? 'O₁（O₂ 的投影）' : merged ? 'O₁ = O₂ = O' : 'O₁';
    labelO1.visible = !atA; labelO2.visible = !merged && next.index !== 2;
    labelA.element.textContent = atA ? 'A = O₁ = O₂' : 'A';
    labelC.element.textContent = next.index <= 1 ? 'C(0,y_C,2)' : 'C';
    labelD.element.textContent = next.index <= 1 ? 'D(√3/2,y_D,½)' : 'D';
    // In the axial view D and D′ project onto the same pixel.
    labelD.visible = next.index !== 2;
    labelA.visible = labelB.visible = next.index !== 2 && next.index !== 5;
    sectionLabel.visible = next.index <= 1 || next.index === 8;
    sectionLabel.element.textContent = atA ? '平面 ACD ⟂ AB' : 'y=y_C ∥ xOz';
    sectionPlaneMaterial.opacity = .055 + (atA ? .13 : 0);
    sphereC.position.copy(c);
    sphereD.position.copy(d);
    updateLine(radialC, vec(axialC, 0, 0), c);
    updateLine(radialD, vec(next.axialD, 0, 0), d);
    updateLine(cdLine, c, d);
    cdLine.material.opacity = 0.55 + next.highlight * 0.4;
    labelC.position.copy(c).add(vec(0.2, 0.22, 0));
    labelD.position.copy(d).add(vec(0.2, 0.22, 0));
    labelDistance.position.copy(c).add(d).multiplyScalar(0.5).add(vec(0.18, 0.18, 0));
    labelDistance.element.textContent = merged ? 'CD = √3' : `CD = ${distanceCD(axialC, next.axialD).toFixed(2)}`;
    labelDistance.visible = next.index !== 2;
    drawProof(next,c,d);
    labelPlaneABD.position.copy(d).add(vec(0.45, 0.55, 0.35));
    labelPlaneABD.visible = next.plane > 0.02;
    labelPlaneABD.element.style.opacity = String(next.plane);
    inset.style.opacity = String(next.inset);
    insetD.textContent = merged ? 'D' : 'D′';
    insetRight.style.opacity = String(next.weight(5) * ramp(next.p,.42,.52));
    insetLength.style.opacity = String(next.index === 2 ? ramp(next.p,.38,.46) : 1);
    setOpacity(planeMesh, next.plane * 0.24);
    updatePlane(next.axialD);
  }

  function setTheme(_next: ThemeName): void {
    theme = getThemeColors();
    scene.traverse((object) => {
      const material = (object as THREE.Mesh).material;
      if (!material) return;
      const list = Array.isArray(material) ? material : [material];
      for (const item of list) {
        const role = item.userData.colorRole as keyof ThemeColors | undefined;
        if (role && 'color' in item) (item as THREE.MeshBasicMaterial).color.set(theme[role]);
      }
    });
    yOzGridMaterial.color.set(theme.grid);
  }

  applyState(state);

  function startCameraTransition(index: number): void {
    const view = CAMERA_VIEWS[index];
    cameraFrom = camera.position.clone();
    targetFrom = controls.target.clone();
    cameraTo = view.position.clone();
    targetTo = view.target.clone();
    zoomFrom = camera.zoom;
    zoomTo = initialDistance / cameraTo.distanceTo(targetTo);
    cameraTween = 0;
  }

  return {
    scene,
    camera,
    enterStep: startCameraTransition,
    setCameraMode(mode: CameraMode): void {
      if (mode === 'free') cameraTween = 1;
    },
    resetCamera(index: number): void {
      startCameraTransition(index);
    },
    seekStep(index: number, progress: number): void {
      if (index !== state.index || progress !== state.p) applyState(lessonState(index, progress));
    },
    update(deltaMs: number): void {
      if (cameraTween < 1) {
        cameraTween = Math.min(1, cameraTween + deltaMs / 1300);
        const t = easeInOut(cameraTween);
        camera.position.lerpVectors(cameraFrom, cameraTo, t);
        controls.target.lerpVectors(targetFrom, targetTo, t);
        camera.zoom = THREE.MathUtils.lerp(zoomFrom, zoomTo, t);
        camera.updateProjectionMatrix();
      }
      controls.update();
    },
    setTheme,
    resize(width: number, height: number): void {
      const aspect = width / height;
      const halfHeight = 5.6 * (aspect < 0.9 ? 1.72 : 1);
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.right = halfHeight * aspect;
      camera.left = -camera.right;
      camera.updateProjectionMatrix();
      scene.traverse((object) => {
        if (object instanceof Line2) object.material.resolution.set(width, height);
      });
    },
    dispose(): void {
      controls.dispose();
      inset.remove();
      disposeObject(scene);
    },
  };
}
