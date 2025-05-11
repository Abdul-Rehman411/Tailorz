"use client";
import React, { useEffect, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const KameezShalwar = ({
  morphValues,
  morphTargets,
  texture,
  buttonTexturePath,
  color,
  shalwarTexturePath,
  collarVisible,
}) => {
  const modelRef = useRef();
  const [gltf, setGltf] = useState(null);
  const textureLoader = useRef(new THREE.TextureLoader());
  const [loadedTexture, setLoadedTexture] = useState(null);
  const [buttonTexture, setButtonTexture] = useState(null);
  const [shalwarTexture, setShalwarTexture] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("/models/kameez-shalwar/kameez-shalwar.glb", (loadedGltf) => {
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
    if (gltf && buttonTexturePath) {
      textureLoader.current.load(buttonTexturePath, (btTex) => {
        btTex.colorSpace = THREE.SRGBColorSpace;
        setButtonTexture(btTex);
      });
    }
  }, [gltf, buttonTexturePath]);

  useEffect(() => {
    if (gltf) {
      // Ensure that the texture is fully loaded before applying it
      if (buttonTexture) {
        // Traverse the scene and apply the button texture
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.material?.name === "Buttons") {
            child.material.map = buttonTexture;
            child.material.needsUpdate = true; // Ensure it triggers material update
          }
        });
      }

      if (shalwarTexture || color) {
        // Traverse the scene and apply the button texture
        gltf.scene.traverse((child) => {
          if (child.isMesh && child.material?.name === "Shalwar") {
            child.material.map = shalwarTexture
              ? shalwarTexture
              : child.material.map;
            child.material.color = color
              ? new THREE.Color(color)
              : child.material.color;
            child.material.needsUpdate = true; // Ensure it triggers material update
          }
        });
      }

      // Now, apply main texture for other parts
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          if (
            child.material?.name !== "Buttons" &&
            child.material?.name !== "Shalwar"
          ) {
            child.material = new THREE.MeshStandardMaterial({
              map: loadedTexture || child.material.map, // Use main texture or keep existing
              color: color ? new THREE.Color(color) : child.material.color, // Update color if provided
              metalness: 0.1,
              roughness: 0.6,
              side: THREE.DoubleSide,
            });
            child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [gltf, loadedTexture, buttonTexture, color, shalwarTexture]);

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
KameezShalwar.morphTargets = ["Belly", "Chest", "Arms", "Legs", "Length"];

export default KameezShalwar;
