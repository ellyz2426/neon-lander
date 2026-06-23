// === Neon Lander VR -- Lander Construction ===

import {
  Group,
  Mesh,
  MeshStandardMaterial,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  PointLight,
  Color,
} from '@iwsdk/core';
import { LANDER_SIZE, LanderSkin, SKIN_COLORS } from './types';

export function buildLanderMesh(skin: LanderSkin): {
  landerGroup: Group;
  bodyMesh: Mesh;
  flameMesh: Mesh;
  thrustLight: PointLight;
} {
  const colors = SKIN_COLORS[skin];
  const landerGroup = new Group();
  const s = LANDER_SIZE;

  // Body: cone (capsule top)
  const bodyGeo = new ConeGeometry(s * 0.6, s * 1.2, 6);
  const bodyMat = new MeshStandardMaterial({
    color: colors.body,
    emissive: colors.emissive,
    emissiveIntensity: 0.4,
    roughness: 0.3,
    metalness: 0.7,
  });
  const bodyMesh = new Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = s * 0.3;
  landerGroup.add(bodyMesh);

  // Cockpit window
  const windowGeo = new SphereGeometry(s * 0.18, 8, 8);
  const windowMat = new MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x44aaff,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.9,
  });
  const windowMesh = new Mesh(windowGeo, windowMat);
  windowMesh.position.set(0, s * 0.45, s * 0.2);
  landerGroup.add(windowMesh);

  // Left leg
  const legGeo = new CylinderGeometry(s * 0.04, s * 0.04, s * 0.5, 4);
  const legMat = new MeshStandardMaterial({
    color: 0x888899,
    roughness: 0.6,
    metalness: 0.4,
  });
  const leftLeg = new Mesh(legGeo, legMat);
  leftLeg.position.set(-s * 0.4, -s * 0.3, 0);
  leftLeg.rotation.z = 0.3;
  landerGroup.add(leftLeg);

  // Right leg
  const rightLeg = new Mesh(legGeo, legMat);
  rightLeg.position.set(s * 0.4, -s * 0.3, 0);
  rightLeg.rotation.z = -0.3;
  landerGroup.add(rightLeg);

  // Foot pads
  const footGeo = new CylinderGeometry(s * 0.1, s * 0.12, s * 0.04, 6);
  const leftFoot = new Mesh(footGeo, legMat);
  leftFoot.position.set(-s * 0.55, -s * 0.55, 0);
  landerGroup.add(leftFoot);

  const rightFoot = new Mesh(footGeo, legMat);
  rightFoot.position.set(s * 0.55, -s * 0.55, 0);
  landerGroup.add(rightFoot);

  // Flame (cone pointing down, hidden by default)
  const flameGeo = new ConeGeometry(s * 0.25, s * 0.6, 6);
  const flameMat = new MeshStandardMaterial({
    color: colors.flame,
    emissive: colors.flame,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.8,
  });
  const flameMesh = new Mesh(flameGeo, flameMat);
  flameMesh.position.y = -s * 0.6;
  flameMesh.rotation.x = Math.PI; // point down
  flameMesh.visible = false;
  landerGroup.add(flameMesh);

  // Thrust light
  const thrustLight = new PointLight(new Color(colors.flame), 0, 3);
  thrustLight.position.y = -s * 0.5;
  landerGroup.add(thrustLight);

  return { landerGroup, bodyMesh, flameMesh, thrustLight };
}

export function updateLanderSkin(
  bodyMesh: Mesh,
  flameMesh: Mesh,
  thrustLight: PointLight,
  skin: LanderSkin,
): void {
  const colors = SKIN_COLORS[skin];
  const bodyMat = bodyMesh.material as MeshStandardMaterial;
  bodyMat.color.setHex(colors.body);
  bodyMat.emissive.setHex(colors.emissive);

  const flameMat = flameMesh.material as MeshStandardMaterial;
  flameMat.color.setHex(colors.flame);
  flameMat.emissive.setHex(colors.flame);

  thrustLight.color.setHex(colors.flame);
}
