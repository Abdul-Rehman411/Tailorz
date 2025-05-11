"use client";
import React, { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const FemaleDress = ({ morphValues, morphTargets, texture, color }) => {
  const modelRef = useRef();
  const [gltf, setGltf] = useState(null);
  const textureLoader = useRef(new THREE.TextureLoader());
  const [loadedTexture, setLoadedTexture] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("/models/female-dress/female-dress.glb", (loadedGltf) => {
      setGltf(loadedGltf);
    });
  }, []);

  useEffect(() => {
    if (gltf && texture) {
      textureLoader.current.load(texture, (newTexture) => {
        newTexture.colorSpace = THREE.SRGBColorSpace; // Better color accuracy
        setLoadedTexture(newTexture);
      });
    } else {
      setLoadedTexture(null); // Reset texture if none is selected
    }
  }, [texture, gltf]);

  useEffect(() => {
    if (gltf) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          // Apply the texture if available, otherwise keep the GLTF texture
          child.material = new THREE.MeshStandardMaterial({
            map: loadedTexture || child.material.map, // Use the default texture if no new one is provided
            color: color ? new THREE.Color(color) : child.material.color, // Apply color only if selected
            metalness: 0.1,
            roughness: 0.6,
            side: THREE.DoubleSide,
          });
          child.material.needsUpdate = true;
        }
      });
    }
  }, [gltf, loadedTexture, color]);

  useFrame(() => {
    if (modelRef.current && gltf) {
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.morphTargetInfluences) {
          morphTargets.forEach((_, index) => {
            child.morphTargetInfluences[index] = morphValues[index] || 0;
          });
        }
      });
    }
  });

  return gltf ? (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      position={[-0.03, -3.3, 1]}
      scale={[1.7, 1.7, 1.7]}
    />
  ) : null;
};
FemaleDress.morphTargets = ["Belly", "Waist", "Skirt", "Chest", "Arms"];

export default FemaleDress;
