import * as THREE from 'three';
import { makeLabel, makeLine, vec } from '../stage/math3d';
import type { ThemeColors } from '../stage/theme';
import { TRACKS } from './dihedralMath';

type V = THREE.Vector3;
type Role = 'blue' | 'teal' | 'gold' | 'red';
export interface ProofFrame {
  index: number; p: number; weight: (...steps: number[]) => number;
}
const middle = (a: V,b: V) => a.clone().lerp(b,.5);
const direction = (a: V,b: V) => b.clone().sub(a).normalize();
const clamp = (v: number) => THREE.MathUtils.clamp(v,0,1);
function arc(center: V, a: V, b: V, radius: number) {
  const u = direction(center,a), v = direction(center,b), angle = u.angleTo(v);
  const perp = v.addScaledVector(u,-u.dot(v)).normalize();
  return Array.from({length:25}, (_,i) => center.clone().addScaledVector(u,radius*Math.cos(angle*i/24)).addScaledVector(perp,radius*Math.sin(angle*i/24)));
}
function square(v: V, a: V, b: V) {
  const u = direction(v,a).multiplyScalar(.21), w = direction(v,b).multiplyScalar(.21);
  return [v.clone().add(u),v.clone().add(u).add(w),v.clone().add(w)];
}

export function createProofDrawing(scene: THREE.Scene, theme: ThemeColors) {
  function stroke(role: Role, dashed = false) {
    const line = makeLine([vec(0,0,0),vec(1,0,0)],theme[role],2.8,{dashed});
    line.material.userData.colorRole = role;
    scene.add(line);
    return (points: V[], opacity: number) => {
      line.visible = opacity > .01;
      if (!line.visible) return;
      line.material.opacity = opacity;
      const geometry = line.geometry;
      const start = geometry.getAttribute('instanceStart'), end = geometry.getAttribute('instanceEnd');
      if (start.count !== points.length-1) {
        geometry.dispose();
        geometry.setPositions(points.flatMap(v => [v.x,v.y,v.z]));
      } else {
        for (let i=0; i<points.length-1; i++) {
          const a=points[i], b=points[i+1];
          start.setXYZ(i,a.x,a.y,a.z); end.setXYZ(i,b.x,b.y,b.z);
        }
        start.needsUpdate = end.needsUpdate = true;
        geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      }
      if (dashed) line.computeLineDistances();
    };
  }
  function tag(role: Role, dx: number, dy: number) {
    const label = makeLabel('',role === 'red' ? 'accent' : role);
    label.element.style.marginLeft = dx+'px'; label.element.style.marginTop = dy+'px';
    scene.add(label);
    return (at: V, text: string, opacity: number) => {
      label.visible = opacity > .01;
      if (!label.visible) return;
      label.position.copy(at); label.element.textContent = text; label.element.style.opacity = String(opacity);
    };
  }
  const projection = stroke('blue'), gapLine = stroke('teal',true), rightFoot = stroke('teal');
  const translated = stroke('teal',true), goldArc = stroke('gold'), vertexArc = stroke('red');
  const rightD = stroke('red'), ac = stroke('blue'), ad = stroke('teal'), od = stroke('teal'), ab = stroke('gold');
  const foot = tag('teal',-16,11), projLength = tag('blue',-25,-9), gapLength = tag('teal',0,18);
  const given = tag('gold',18,4), atA = tag('red',-20,-18), ao = tag('gold',-14,29);
  const radius1 = tag('teal',-16,10), radius2 = tag('blue',17,0);
  const vertexMaterial = new THREE.MeshBasicMaterial({color:theme.teal,transparent:true});
  vertexMaterial.userData.colorRole='teal';
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.065,16,12),vertexMaterial); scene.add(dot);
  const A=vec(0,0,0), B=vec(TRACKS.abLength,0,0);
  return ({index,p,weight}: ProofFrame,c: V,d: V) => {
    const o=vec(c.x,0,0), dp=vec(c.x,d.y,d.z), gap=Math.abs(d.x-c.x);
    const distinct = clamp(gap/.38);
    const construct=weight(1,2,3,4), axes=weight(6), example=weight(7,8);
    const showFoot=construct*distinct;
    const slide=index===1 ? THREE.MathUtils.smoothstep(p,.16,.43) : 1;
    const translatedO=vec(THREE.MathUtils.lerp(d.x,c.x,slide),0,0);
    translated([translatedO,vec(translatedO.x,d.y,d.z)],construct*(index===1?clamp(p/.14):1));
    dot.position.copy(dp); dot.visible=showFoot>.01; vertexMaterial.opacity=showFoot;
    foot(dp,'D′',showFoot*(index===1?slide:1));
    const triangle=weight(2,3,4);
    projection([c,dp],triangle*distinct);
    projLength(middle(c,dp),'CD′ = √3',triangle*distinct*(index===2?THREE.MathUtils.smoothstep(p,.38,.46):1));
    gapLine([d,dp],weight(3,4)*distinct);
    gapLength(middle(d,dp),'DD′ = '+gap.toFixed(2),weight(3,4)*distinct);
    rightFoot(square(dp,c,d),weight(3,4)*distinct);
    const radialArc=arc(o,c,dp,.45);
    // At O=A the two angle arcs coincide geometrically; use two radii while they approach.
    const givenOpacity=weight(1,2,7,8)*(index===1?slide:1)*(index===8?clamp(c.x/.4):1);
    goldArc(radialArc,givenOpacity); given(radialArc[12],'60°',givenOpacity);
    const angleA=arc(A,c,d,.75);
    vertexArc(angleA,example); atA(angleA[12], '∠CAD '+THREE.MathUtils.radToDeg(c.angleTo(d)).toFixed(1).replace(/\.0$/,'')+'°',example);
    ac([A,c],example); ad([A,d],Math.max(example,axes*.8));
    od([o,d],Math.max(weight(5),axes)); ab([A,B],axes*.8);
    const markOD = weight(5,6)*(index===5?THREE.MathUtils.smoothstep(p,.42,.52):1);
    rightD(square(d,c,index===7?A:o),Math.max(markOD,weight(7)*(1-weight(8))));
    ao(middle(A,o),'AO = √2',weight(7)*(Math.abs(c.x-Math.SQRT2)<.001?1:0));
    radius1(middle(o,d),'1',weight(1,5)); radius2(middle(o,c),'2',weight(1,5));
  };
}
