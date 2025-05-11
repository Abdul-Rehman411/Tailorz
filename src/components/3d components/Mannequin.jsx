"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const Mannequin = ({ colorValue, gender, useSkirtAsDefaultLegs = true }) => {
  const mannequinRef = useRef();
  const mannequin = useLoader(
    OBJLoader,
    gender === "female"
      ? "/models/mannequin/mannequin-female.obj"
      : "/models/mannequin/mannequin-male.obj"
  );

  const [femaleParts, setFemaleParts] = useState(null);
  const [femaleSkirt, setFemaleSkirt] = useState(null);
  const [boxers, setBoxers] = useState(null);

  const getSkinTone = (value) => {
    const skinTones = [
      new THREE.Color(1.0, 0.87, 0.77), // Very Light
      new THREE.Color(0.98, 0.78, 0.64), // Light
      new THREE.Color(0.87, 0.62, 0.45), // Medium
      new THREE.Color(0.76, 0.53, 0.36), // Tan
      new THREE.Color(0.63, 0.42, 0.28), // Brown
      new THREE.Color(0.5, 0.33, 0.21), // Dark Brown
      new THREE.Color(0.38, 0.26, 0.15), // Deep Brown
      new THREE.Color(0.25, 0.17, 0.1), // Very Dark Skin
    ];
    const index = Math.floor(value * (skinTones.length - 1));
    const nextIndex = Math.min(index + 1, skinTones.length - 1);
    const blendFactor = value * (skinTones.length - 1) - index;
    return skinTones[index].lerp(skinTones[nextIndex], blendFactor);
  };

  useEffect(() => {
    const loadFemaleExtras = async () => {
      const transform = (obj) => {
        obj.scale.set(1.7, 1.7, 1.7);
        obj.position.set(-0.03, -3.3, 1);
      };

      if (gender === "female") {
        const [partsGLB, skirtGLB] = await Promise.all([
          new GLTFLoader().loadAsync(
            "/models/mannequin/mannequin-female-parts.glb"
          ),
          new GLTFLoader().loadAsync(
            "/models/mannequin/mannequin-female-skirt.glb"
          ),
        ]);

        transform(partsGLB.scene);
        transform(skirtGLB.scene);

        setFemaleParts(partsGLB.scene);
        setFemaleSkirt(skirtGLB.scene);
      } else if (gender === "male") {
        const boxersGLB = await new GLTFLoader().loadAsync(
          "/models/mannequin/boxers.glb"
        );

        transform(boxersGLB.scene);

        setBoxers(boxersGLB.scene);

        setFemaleParts(null);
        setFemaleSkirt(null);
      }
    };

    loadFemaleExtras();
  }, [gender]);

  useEffect(() => {
    if (mannequin) {
      mannequin.scale.set(1.7, 1.7, 1.7);
      mannequin.position.set(-0.03, -3.3, 1);

      mannequin.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: getSkinTone(colorValue),
            metalness: 0.05,
            roughness: 0.7,
            side: THREE.DoubleSide,
          });
        }
      });
    }
  }, [mannequin, colorValue]);

  return (
    <>
      <primitive ref={mannequinRef} object={mannequin} />
      {gender === "female" && femaleParts && <primitive object={femaleParts} />}
      {gender === "female" && useSkirtAsDefaultLegs && femaleSkirt && (
        <primitive object={femaleSkirt} />
      )}
      {gender === "male" && useSkirtAsDefaultLegs && boxers && (
        <primitive object={boxers} />
      )}
    </>
  );
};

export default Mannequin;
