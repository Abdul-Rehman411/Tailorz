"use client";
import React, { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const FemaleGown = ({
  morphValues,
  morphTargets,
  texture,
  color,
  shalwarTexturePath,
  collarVisible,
}) => {
  const modelRef = useRef();
  const [gltf, setGltf] = useState(null);
  const textureLoader = useRef(new THREE.TextureLoader());
  const [loadedTexture, setLoadedTexture] = useState(null);
  const [shalwarTexture, setShalwarTexture] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("/models/female-gown/female-gown.glb", (loadedGltf) => {
      setGltf(loadedGltf);
    });
  }, []);

  useEffect(() => {
    if (gltf && texture) {
      textureLoader.current.load(texture, (newTexture) => {
        newTexture.colorSpace = THREE.SRGBColorSpace;
        setLoadedTexture(newTexture);
      });
    } else {
      setLoadedTexture(null);
    }
  }, [texture, gltf]);

  useEffect(() => {
    if (!gltf) return;

    const collarMesh = gltf.scene.getObjectByName("Collar"); // use the actual mesh name here
    if (collarMesh) {
      collarMesh.visible = collarVisible;
    }
  }, [gltf, collarVisible]);

  useEffect(() => {
    if (gltf && shalwarTexturePath) {
      textureLoader.current.load(shalwarTexturePath, (shalwarTex) => {
        shalwarTex.colorSpace = THREE.SRGBColorSpace;
        setShalwarTexture(shalwarTex);
      });
    }
  }, [gltf, shalwarTexturePath]);

  useEffect(() => {
    if (gltf) {
      // Ensure that the texture is fully loaded before applying it
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          if (child.material?.name === "Skirt") {
            child.material.map = shalwarTexture || child.material.map;
            child.material.color = color
              ? new THREE.Color(color)
              : child.material.color;
            child.material.needsUpdate = true;
          } else if (child.material?.name === "Top") {
            child.material.map = loadedTexture || child.material.map;
            child.material.color = color
              ? new THREE.Color(color)
              : child.material.color;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [gltf, loadedTexture, color, shalwarTexture]);

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
FemaleGown.morphTargets = ["Arms", "Belly", "Chest"];

export default FemaleGown;
