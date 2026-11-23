import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import {
  circlePoints,
  disposeObject,
  makeLabel,
  makeLine,
  makeLoop,
  setOpacity,
  vec,
} from '../stage/math3d';
import { getThemeColors, type ThemeColors } from '../stage/theme';
import { distanceCD, pointC, pointD, TRACKS } from '../scenes/dihedralMath';
import { createProofDrawing } from '../scenes/proofDrawing';
import type { SceneFrameData } from './mathTimeline';

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
  return vec(y, z, x);
}

export class RemotionThreeBridge {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private theme: ThemeColors;
  private drawProof: ReturnType<typeof createProofDrawing>;

  // 场景内物体
  private sphereC: THREE.Mesh;
  private sphereD: THREE.Mesh;
  private radialC: Line2;
  private radialD: Line2;
  private cdLine: Line2;
  private labelA: any;
  private labelB: any;
  private labelC: any;
  private labelD: any;
  private labelDistance: any;
  private labelPlaneABD: any;
  private labelO1: any;
  private labelO2: any;
  private sectionLabel: any;
  private sectionPlaneMaterial: THREE.MeshBasicMaterial;
  private sectionLoopC: Line2;
  private sectionLoopD: Line2;
  private updatePlane: (axialD: number) => void;
  private planeMesh: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement, labelContainer: HTMLDivElement, width: number, height: number) {
    this.theme = {
      ink: '#f0f4fc',
      muted: '#8e9bb0',
      blue: '#4a88e8',
      red: '#e05344',
      teal: '#2cb5a0',
      gold: '#f0b232',
      surface: '#0d1522',
      grid: '#223249',
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-5.6, 5.6, 5.6, -5.6, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(1);

    this.labelRenderer = new CSS2DRenderer({ element: labelContainer });
    this.labelRenderer.setSize(width, height);

    // 灯光
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x526273, 2.1));
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(7, 12, 10);
    this.scene.add(mainLight);

    // 轴与基准点
    const origin = vec(0, 0, 0);
    const pointB = vec(TRACKS.abLength, 0, 0);
    const axis = makeLine([origin, pointB], this.theme.gold, 3.4, { opacity: 0.82 });
    this.scene.add(axis);

    const endpointMaterial = new THREE.MeshStandardMaterial({
      color: this.theme.gold,
      roughness: 0.22,
      metalness: 0.2,
    });
    for (const x of [origin.x, pointB.x]) {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 18), endpointMaterial);
      marker.position.x = x;
      this.scene.add(marker);
    }

    // 坐标轴引导
    const addAxisGuide = (name: 'x' | 'y' | 'z', role: 'gold' | 'teal' | 'blue', start: THREE.Vector3, tip: THREE.Vector3) => {
      const direction = tip.clone().sub(start).normalize();
      const headLength = 0.23;
      const base = tip.clone().addScaledVector(direction, -headLength);
      const dashed = name === 'y';
      const shaft = makeLine([start, base], this.theme[role], dashed ? 1.4 : 1.7, { opacity: dashed ? 0.55 : 0.46, dashed });
      const material = new THREE.MeshBasicMaterial({ color: this.theme[role], toneMapped: false });
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, headLength, 20), material);
      head.quaternion.setFromUnitVectors(vec(0, 1, 0), direction);
      head.position.copy(base).addScaledVector(direction, headLength / 2);

      const label = makeLabel(name, role);
      label.position.copy(tip);
      label.element.style.margin = name === 'z' ? '-14px 0 0' : '14px 0 0 12px';
      this.scene.add(shaft, head, label);
    };

    addAxisGuide('x', 'gold', origin, vec(0, 0, 4.2));
    addAxisGuide('z', 'teal', origin, vec(0, 4.2, 0));
    addAxisGuide('y', 'blue', pointB, vec(TRACKS.abLength + 0.6, 0, 0));

    // yOz 基准面与网格
    const yOzPlaneMaterial = new THREE.MeshBasicMaterial({
      color: this.theme.blue,
      transparent: true,
      opacity: 0.035,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const yOzPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), yOzPlaneMaterial);
    yOzPlane.rotation.y = Math.PI / 2;
    yOzPlane.position.set(0, 0.4, 0);
    this.scene.add(yOzPlane);

    const yOzGrid = new THREE.GridHelper(10, 10, this.theme.grid, this.theme.grid);
    yOzGrid.rotation.z = Math.PI / 2;
    yOzGrid.position.set(0, 0.4, 0);
    (yOzGrid.material as THREE.Material).transparent = true;
    (yOzGrid.material as THREE.Material).opacity = 0.12;
    this.scene.add(yOzGrid);

    const yOzLabel = makeLabel('yOz', 'subtle');
    yOzLabel.position.set(0, 1.3, -4.5);
    this.scene.add(yOzLabel);

    // 圆柱面与轨道圆环
    const tubeC = makeTube(TRACKS.radiusC, 11, this.theme.blue);
    const tubeD = makeTube(TRACKS.radiusD, 11, this.theme.teal);
    tubeC.group.position.x = 5.5;
    tubeD.group.position.x = 5.5;
    this.scene.add(tubeC.group, tubeD.group);

    this.sectionLoopC = makeLoop(circlePoints(vec(TRACKS.axialC, 0, 0), TRACKS.radiusC, vec(1, 0, 0)), this.theme.blue, 2.5, 0.95);
    this.sectionLoopD = makeLoop(circlePoints(vec(TRACKS.axialDStart, 0, 0), TRACKS.radiusD, vec(1, 0, 0)), this.theme.teal, 2.2, 0.9);
    this.scene.add(this.sectionLoopC, this.sectionLoopD);

    // 截面
    this.sectionPlaneMaterial = new THREE.MeshBasicMaterial({
      color: this.theme.teal,
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const sectionPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.8), this.sectionPlaneMaterial);
    sectionPlane.rotation.y = Math.PI / 2;
    this.scene.add(sectionPlane);

    this.sectionLabel = makeLabel('y=y_C ∥ xOz', 'subtle');
    this.scene.add(this.sectionLabel);

    // 平面 ABD
    const planeGeo = new THREE.BufferGeometry();
    planeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    planeGeo.setIndex([0, 1, 2, 0, 2, 3]);
    const planeMat = new THREE.MeshBasicMaterial({
      color: this.theme.blue,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.planeMesh = new THREE.Mesh(planeGeo, planeMat);
    this.scene.add(this.planeMesh);

    this.updatePlane = (axialD: number) => {
      const dWorld = toWorld(pointD(axialD));
      const dir = dWorld.clone().setX(0).normalize();
      const pA = vec(-1.2, 0, 0);
      const pB = vec(TRACKS.abLength + 1.2, 0, 0);
      const p1 = pA.clone().addScaledVector(dir, 4.4);
      const p2 = pB.clone().addScaledVector(dir, 4.4);
      const p0 = pA.clone().addScaledVector(dir, -1.8);
      const p3 = pB.clone().addScaledVector(dir, -1.8);
      const pos = planeGeo.attributes.position as THREE.BufferAttribute;
      const pts = [p0, p1, p2, p3];
      for (let i = 0; i < 4; i++) {
        pos.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
      }
      pos.needsUpdate = true;
      planeGeo.computeVertexNormals();
    };

    // 动点与连线
    const matC = new THREE.MeshStandardMaterial({ color: this.theme.blue, roughness: 0.2, metalness: 0.1 });
    const matD = new THREE.MeshStandardMaterial({ color: this.theme.teal, roughness: 0.2, metalness: 0.1 });
    this.sphereC = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), matC);
    this.sphereD = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), matD);
    this.scene.add(this.sphereC, this.sphereD);

    this.radialC = makeLine([vec(TRACKS.axialC, 0, 0), vec(TRACKS.axialC, 2, 0)], this.theme.blue, 1.8, { dashed: true });
    this.radialD = makeLine([vec(TRACKS.axialDStart, 0, 0), vec(TRACKS.axialDStart, 0.5, 0.866)], this.theme.teal, 1.8, { dashed: true });
    this.cdLine = makeLine([vec(0, 0, 0), vec(1, 1, 1)], this.theme.red, 3.4, { opacity: 0.95 });
    this.scene.add(this.radialC, this.radialD, this.cdLine);

    // 标签
    this.labelA = makeLabel('A', 'gold');
    this.labelA.position.set(0, 0.22, 0);
    this.labelB = makeLabel('B', 'gold');
    this.labelB.position.set(TRACKS.abLength, 0.22, 0);
    this.labelC = makeLabel('C(0,y_C,2)', 'blue');
    this.labelD = makeLabel('D(√3/2,y_D,½)', 'teal');
    this.labelDistance = makeLabel('CD = 3.64', 'accent');
    this.labelPlaneABD = makeLabel('平面 ABD', 'blue');
    this.labelO1 = makeLabel('O₁', 'blue');
    this.labelO1.position.set(TRACKS.axialC - 0.28, -0.24, 0.28);
    this.labelO2 = makeLabel('O₂', 'teal');
    this.labelO2.position.set(TRACKS.axialDStart + 0.12, -0.24, 0.28);
    this.scene.add(this.labelA, this.labelB, this.labelC, this.labelD, this.labelDistance, this.labelPlaneABD, this.labelO1, this.labelO2);

    this.drawProof = createProofDrawing(this.scene, this.theme);
  }

  public render(data: SceneFrameData, width: number, height: number): void {
    // 1. 设置正交相机视口
    const aspect = width / height;
    const halfHeight = 5.6 * (aspect < 0.9 ? 1.72 : 1);
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.right = halfHeight * aspect;
    this.camera.left = -this.camera.right;

    this.camera.position.copy(data.cameraPosition);
    this.camera.lookAt(data.cameraTarget);
    this.camera.zoom = data.cameraZoom;
    this.camera.updateProjectionMatrix();

    this.scene.traverse((object) => {
      if (object instanceof Line2) {
        object.material.resolution.set(width, height);
      }
    });

    // 2. 更新几何与动点
    const c = toWorld(pointC(data.axialC));
    const d = toWorld(pointD(data.axialD));

    this.sphereC.position.copy(c);
    this.sphereD.position.copy(d);

    updateLine(this.radialC, vec(data.axialC, 0, 0), c);
    updateLine(this.radialD, vec(data.axialD, 0, 0), d);
    updateLine(this.cdLine, c, d);
    this.cdLine.material.opacity = 0.55 + data.highlight * 0.4;

    this.labelC.position.copy(c).add(vec(0.2, 0.22, 0));
    this.labelD.position.copy(d).add(vec(0.2, 0.22, 0));

    this.labelDistance.position.copy(c).add(d).multiplyScalar(0.5).add(vec(0.18, 0.18, 0));
    this.labelDistance.element.textContent = data.isMerged ? 'CD = √3' : `CD = ${distanceCD(data.axialC, data.axialD).toFixed(2)}`;
    this.labelDistance.visible = data.stepIndex !== 2;

    const isEndOn = Math.abs(data.cameraPosition.z) < 0.6 && data.cameraPosition.x > 12;
    this.labelO1.position.set(data.axialC - 0.28, -0.24, 0.28);
    this.labelO2.position.set(data.axialD + 0.12, -0.24, 0.28);

    if (data.isAtA) {
      this.labelO1.element.textContent = 'A = O₁ = O₂';
      this.labelO1.visible = true;
      this.labelO2.visible = false;
      this.labelA.visible = false;
    } else if (data.isMerged) {
      this.labelO1.element.textContent = 'O₁ = O₂ = O';
      this.labelO1.visible = true;
      this.labelO2.visible = false;
      this.labelA.visible = !isEndOn;
    } else {
      this.labelO1.element.textContent = isEndOn ? 'O₁ (O₂ 的投影)' : 'O₁';
      this.labelO1.visible = true;
      this.labelO2.visible = !isEndOn;
      this.labelA.visible = !isEndOn;
    }

    this.labelB.visible = !isEndOn;
    this.sectionLabel.visible = data.showSectionLabel && !isEndOn;
    this.sectionLabel.element.textContent = data.sectionLabelText;
    this.sectionPlaneMaterial.opacity = 0.055 + (data.isAtA ? 0.13 : 0);

    // 截面位置更新
    this.sectionLoopC.position.x = data.axialC - TRACKS.axialC;
    this.sectionLoopD.position.x = data.axialD - TRACKS.axialDStart;

    // 平面 ABD 更新
    setOpacity(this.planeMesh, data.planeOpacity * 0.24);
    this.updatePlane(data.axialD);
    this.labelPlaneABD.position.copy(d).add(vec(0.45, 0.55, 0.35));
    this.labelPlaneABD.visible = data.planeOpacity > 0.02;
    this.labelPlaneABD.element.style.opacity = String(data.planeOpacity);

    // 绘制辅助线与证明几何
    const weightHelper = (...steps: number[]) => (steps.includes(data.stepIndex) ? 1 : 0);
    this.drawProof(
      {
        index: data.stepIndex,
        p: data.stepProgress,
        weight: weightHelper,
      },
      c,
      d
    );

    // 3. 渲染 WebGL 和 CSS2D
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    disposeObject(this.scene);
    this.renderer.dispose();
  }
}
