"use client";
import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Mannequin from "./Mannequin";
import Jacket from "./Jacket";
import Shirt from "./Shirt";
import Pants from "./Pants";
import FemaleDress from "./FemaleDress";
import KameezShalwar from "./KameezShalwar";
import FemaleCoat from "./FemaleCoat";
import FemaleGown from "./FemaleGown";
import FemaleJacket from "./FemaleJacket";
import FullShirt from "./FullShirt";
import Trousers from "./Trousers";

const outfitComponents = {
  jacket: Jacket,
  shirt: Shirt,
  pants: Pants,
  femaleDress: FemaleDress,
  kameezShalwar: KameezShalwar,
  femaleCoat: FemaleCoat,
  femaleGown: FemaleGown,
  femaleJacket: FemaleJacket,
  fullShirt: FullShirt,
  trousers: Trousers,
};

const CustomizationScene = ({
  outfitTypes,
  morphValues,
  setMorphValues,
  setMorphTargets,
  colorValue,
  texture,
  color,
  gender,
  buttonTexturePath,
  shalwarTexurePath,
  collarVisible,
}) => {
  const [selectedOutfits, setSelectedOutfits] = useState([]);
  const [morphTargets, localSetMorphTargets] = useState({});

  useEffect(() => {
    const newOutfits = outfitTypes
      .map((type) => outfitComponents[type])
      .filter(Boolean);

    setSelectedOutfits(newOutfits);

    const newMorphTargets = {};
    newOutfits.forEach((OutfitComponent) => {
      const targets = OutfitComponent.morphTargets || [];
      newMorphTargets[OutfitComponent.name] = targets;
    });

    localSetMorphTargets(newMorphTargets);

    setMorphTargets((prevTargets) => {
      // Only update if there's a change
      if (JSON.stringify(prevTargets) !== JSON.stringify(newMorphTargets)) {
        return newMorphTargets;
      }
      return prevTargets;
    });

    setMorphValues((prev) => {
      const updatedMorphValues = { ...prev };
      newOutfits.forEach((OutfitComponent) => {
        if (!updatedMorphValues[OutfitComponent.name]) {
          updatedMorphValues[OutfitComponent.name] = Array(
            OutfitComponent.morphTargets?.length || 0
          ).fill(0);
        }
      });

      // Only update if there's a change
      if (JSON.stringify(prev) !== JSON.stringify(updatedMorphValues)) {
        return updatedMorphValues;
      }
      return prev;
    });
  }, [outfitTypes, setMorphTargets, setMorphValues]);

  return (
    <Canvas
      style={{
        width: "99%",
        height: "100%",
        border: "solid 1px black",
        background: "gray",
        borderRadius: "0.375rem",
        backgroundImage: "url('/images/assets/wardrobe.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} />

      <Mannequin
        colorValue={colorValue}
        gender={gender}
        useSkirtAsDefaultLegs={
          !outfitTypes.some((type) =>
            [
              "pants",
              "shorts",
              "skirt",
              "jeans",
              "femaleDress",
              "kameezShalwar",
              "trousers",
            ].includes(type)
          )
        }
      />

      {selectedOutfits.map((Outfit, index) => (
        <Outfit
          key={index}
          morphValues={morphValues[Outfit.name] || []}
          morphTargets={morphTargets[Outfit.name] || []}
          texture={texture[Outfit.name]}
          color={color[Outfit.name]}
          buttonTexturePath={buttonTexturePath}
          shalwarTexturePath={shalwarTexurePath}
          collarVisible={collarVisible}
        />
      ))}

      <OrbitControls minDistance={1} maxDistance={7} />
    </Canvas>
  );
};

export default React.memo(CustomizationScene);
