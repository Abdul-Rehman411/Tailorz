"use client";
import { useContext, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import UserContext from "@/utils/UserContext";
import CustomizationScene from "@/components/3d components/CustomizationScene";
import { Resizable } from "re-resizable";
import ColorPicker from "@/components/ColorPicker";
import SimpleButton from "@/components/SimpleButton";
import useImageUpload from "../hooks/useImageUpload";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import ShareLinkDialog from "@/components/ShareLinkDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ButtonSelector from "@/components/3d components/ButtonSelector";
import FloatingInfoBubble from "@/components/FloatingInfoBubble";
import AddToCart from "@/components/AddToCart";

const outfitCategories = {
  jacket: { category: "torso", gender: "male" },
  pants: { category: "legs", gender: "male" },
  shirt: { category: "torso", gender: "male" },
  jeans: { category: "legs", gender: "unisex" },
  femaleDress: { category: "full", gender: "female" },
  kameezShalwar: { category: "full", gender: "male" },
  femaleCoat: { category: "torso", gender: "female" },
  femaleGown: { category: "full", gender: "female" },
  femaleJacket: { category: "torso", gender: "female" },
  fullShirt: { category: "torso", gender: "male" },
  trousers: { category: "legs", gender: "female" },
  // Add more here...
};

const hasButtonsTypes = [
  "Jacket",
  "KameezShalwar",
  "Shirt",
  "FemaleJacket",
  "FullShirt",
];

const OutfitCustomization = () => {
  const {
    theme,
    userData,
    userLoggedIn,
    setShowMessage,
    setPopUpMessageTrigger,
  } = useContext(UserContext);
  const [selectedGender, setSelectedGender] = useState(null);
  const searchParams = useSearchParams();
  const [shareLink, setShareLink] = useState(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("share", "");
    return url.toString();
  });

  const [linkGenerated, setLinkGenerated] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const [product, setProduct] = useState(null);

  // Get outfit(s) from URL and convert them into an array
  const outfitTypes = searchParams.get("outfit")?.split(",") || [];
  const shareId = searchParams.get("share");

  const fetchSharedOutfit = async (shareId) => {
    try {
      const docRef = doc(db, "myOutfits", shareId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const outfitData = docSnap.data();
        return outfitData;
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching shared outfit:", error);
      throw error;
    }
  };

  let selectedGenderLocal = null;
  const uniqueOutfits = [];
  const usedCategories = new Set();

  outfitTypes.forEach((outfit) => {
    const outfitInfo = outfitCategories[outfit];
    if (!outfitInfo) return;

    const { category, gender } = outfitInfo;

    // If outfit is non-unisex and we haven't set a selected gender yet, set it.
    if (gender !== "unisex" && !selectedGenderLocal) {
      selectedGenderLocal = gender;
    }

    // Filter: only accept outfits that are either unisex or match the selected gender.
    if (gender !== "unisex" && gender !== selectedGenderLocal) return;

    if (category === "full") {
      uniqueOutfits.length = 0;
      usedCategories.clear();
      uniqueOutfits.push(outfit);
      usedCategories.add("full");
    } else if (
      !usedCategories.has("full") &&
      category &&
      !usedCategories.has(category)
    ) {
      uniqueOutfits.push(outfit);
      usedCategories.add(category);
    }
  });

  // Now update your state once:
  if (!selectedGender) {
    setSelectedGender(selectedGenderLocal);
  }

  const [morphTargets, setMorphTargets] = useState({});
  const [morphValues, setMorphValues] = useState({});
  const [colorValue, setColorValue] = useState(0.5); // Default color brightness
  const [texture, setTexture] = useState({});
  const [color, setColor] = useState({});
  const [selectedOutfit, setSelectedOutfit] = useState(null); // Track the selected outfit for color picker visibility
  const [shalwarTexure, setshalwarTexure] = useState(null);
  const [collarVisible, setCollarVisible] = useState(true);
  const [buttonTexturePath, setbuttonTexturePath] = useState(
    "/models/buttons/button3.jpg"
  );
  const [measurements, setMeasurements] = useState({});
  const [showActionButtons, setShowActionButtons] = useState(false);

  useEffect(() => {
    const getSharedOutfit = async () => {
      const outfitData = await fetchSharedOutfit(shareId);
      if (outfitData) {
        setbuttonTexturePath(outfitData.buttonTexturePath);
        setColor(outfitData.color);
        setMorphValues(outfitData.morphValues);
        setColorValue(outfitData.colorValue);
        setTexture(outfitData.texture);
        setCollarVisible(outfitData.collarVisible);
        setshalwarTexure(outfitData.shalwarTexureURL);
      }
    };

    if (shareId) {
      getSharedOutfit();
    }
  }, [shareId]);

  // Fetch measurements from Firestore
  useEffect(() => {
    if (!userData?.uid || !userLoggedIn) return;
    try {
      const fetchData = async () => {
        const docRef = doc(
          db,
          "settings",
          userData.uid,
          "user_settings",
          "measurements"
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMeasurements(docSnap.data());
        }
      };

      fetchData();
    } catch (error) {
      console.log(error.message);
    }
  }, [setMeasurements, userData?.uid, userLoggedIn]);

  useEffect(() => {
    if (!userLoggedIn || shareId || !measurements) return;

    const useInches =
      localStorage.getItem("useInches." + userData?.uid) === "true";
    const toInches = (valCm) => (useInches ? valCm : valCm * 0.393701);

    // 1️⃣ all your measurement ranges (in inches)
    const ranges = {
      chest: [28, 50],
      shoulder: [14, 24],
      torso: [20, 36],
      sleeve: [18, 28],
      neck: [12, 20],
      armhole: [12, 24],
      cuff: [6, 12],
      waist: [24, 48],
      hips: [30, 50],
      legs: [28, 44],
      thigh: [18, 30],
      legOpening: [10, 18],
      arms: [6, 18], // matches “Arms”
      armhole: [7, 14],
      skirt: [20, 40], // matches “Skirt”
    };

    // 2️⃣ map each morph-target name → your measurement key
    const morphToKey = {
      Chest: "chest",
      Waist: "waist",
      Belly: "waist", // use waist for “Belly”
      Length: (outfit) =>
        // if it’s a pants outfit, map “Length” → leg length
        outfit.toLowerCase().includes("pants") ? "legs" : "torso",
      Legs: "legs",
      Arms: "armhole",
      Skirt: "hips",
      Thigh: "thigh",
      Shoulder: "shoulder",
      Torso: "torso",
      Sleeve: "sleeve",
      Neck: "neck",
      Armhole: "armhole",
      Cuff: "cuff",
      Hips: "hips",
      LegOpening: "legOpening",
    };

    // 3️⃣ build initial morph-values
    const initialMorphValues = {};
    Object.entries(morphTargets).forEach(([outfit, targets]) => {
      initialMorphValues[outfit] = targets.map((tgt) => {
        // resolve measurement key
        let key = morphToKey[tgt];
        if (typeof key === "function") key = key(outfit);

        const raw = measurements[key];
        const range = ranges[key];
        if (raw == null || !range) return 0;

        const valInches = toInches(raw);
        const [min, max] = range;
        // clamp & normalize
        return Math.min(1, Math.max(0, (valInches - min) / (max - min)));
      });
    });

    setMorphValues(initialMorphValues);
  }, [measurements, userLoggedIn, shareId, morphTargets, userData?.uid]);

  useEffect(() => {
    const p = JSON.parse(sessionStorage.getItem("product"));
    if (p) {
      setProduct(p);
      setShowActionButtons(true);
    }
  }, []);

  const { uploadImage } = useImageUpload();

  const updateShareLink = (id) => {
    const url = new URL(shareLink);
    url.searchParams.set("share", id);
    setShareLink(url.toString());
  };

  // call this to push all textures up:
  const handleUploadAllTextures = useCallback(async () => {
    const newTextures = {};

    for (const [outfit, blobUrl] of Object.entries(texture)) {
      // only upload real blobs
      if (!blobUrl.startsWith("blob:")) continue;

      try {
        // fetch the blob from the blob‑URL
        const resp = await fetch(blobUrl);
        const blob = await resp.blob();

        // Extract the file extension from the MIME type
        const mimeType = blob.type; // e.g., 'image/png'
        const extension = mimeType.split("/")[1] || "jpg"; // Fallback to 'jpg' if undefined

        // Create a File object with the correct extension
        const file = new File([blob], `${outfit}-${Date.now()}.${extension}`, {
          type: mimeType,
        });

        // upload it
        const { url, error } = await uploadImage(
          file,
          null,
          "images/user/customizations"
        );

        if (error) {
          console.error(`Failed to upload ${outfit}:`, error);
        } else {
          newTextures[outfit] = url;
        }
      } catch (e) {
        console.error(`Error processing ${outfit}:`, e);
      }
    }
    // Manually check and upload shalwarTexure if it exists
    let shalwarTexureURL = "";
    if (shalwarTexure && shalwarTexure.startsWith("blob:")) {
      try {
        const resp = await fetch(shalwarTexure);
        const blob = await resp.blob();
        const mimeType = blob.type;
        const extension = mimeType.split("/")[1] || "jpg";

        const file = new File([blob], `shalwar-${Date.now()}.${extension}`, {
          type: mimeType,
        });

        const { url, error } = await uploadImage(
          file,
          null,
          "images/user/customizations"
        );

        if (error) {
          console.error("Failed to upload shalwarTexure:", error);
        } else {
          shalwarTexureURL = url;
        }
      } catch (e) {
        console.error("Error processing shalwarTexure:", e);
      }
    }

    return { newTextures, shalwarTexureURL };
  }, [shalwarTexure, texture, uploadImage]);

  const uploadCustomization = async () => {
    try {
      if (!userLoggedIn) {
        throw new Error("User not authenticated");
      }
      setGeneratingLink(true);
      let { newTextures, shalwarTexureURL } = await handleUploadAllTextures();
      let outfitNames = uniqueOutfits.toString().toUpperCase();
      const customizations = {
        shalwarTexureURL,
        collarVisible,
        buttonTexturePath,
        outfitNames,
        link: shareLink,
        morphValues,
        colorValue,
        color,
        texture: newTextures,
      };
      // Reference to the 'myOutfits' collection
      const outfitsRef = collection(db, "myOutfits");

      // Add a new document with a generated ID
      const docRef = await addDoc(outfitsRef, {
        userId: userData.uid,
        ...customizations,
        createdAt: serverTimestamp(),
      });

      setLinkGenerated(true);
      updateShareLink(docRef.id);
    } catch (error) {
      console.error("Error uploading customization: ", error);
      throw error;
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleMorphChange = (outfit, index, value) => {
    setMorphValues((prev) => ({
      ...prev,
      [outfit]:
        prev[outfit]?.map((val, i) => (i === index ? value : val)) || [],
    }));
  };

  const handleSetMorphTargets = useCallback((targets) => {
    setMorphTargets(targets);
  }, []);

  const handleSetMorphValues = useCallback((values) => {
    setMorphValues(values);
  }, []);

  const handleTextureUpload = (outfit, shalwar, e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectURL = URL.createObjectURL(file); // Convert file to URL
      if (shalwar) {
        setshalwarTexure(objectURL);
      } else {
        setTexture((prevTextures) => ({
          ...prevTextures,
          [outfit]: objectURL, // Store texture per outfit
        }));
      }
    }
  };

  const handleColorPickerChange = (outfit, color) => {
    setColor((prevColors) => ({
      ...prevColors,
      [outfit]: color, // Store texture per outfit
    }));
  };

  const [isMobile, setIsMobile] = useState(false);
  const [width, setWidth] = useState(30); // Default width for desktop
  const [height, setHeight] = useState("40vh"); // Default height for mobile

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleBuyNow = () => {
    if (!userLoggedIn) {
      setShowMessage({
        type: "danger",
        message: "Please log in to buy now.",
      });
      setPopUpMessageTrigger(true);
      return;
    }
    setShowMessage({
      type: "info",
      message: "We're adding Buy Now functionality later. Stay tuned!",
    });
    setPopUpMessageTrigger(true);
  };

  const handleAddToCart = () => {
    if (!userLoggedIn) {
      setShowMessage({
        type: "info",
        message: "Please login to add items to cart",
      });
      setPopUpMessageTrigger(true);
      return;
    }
    setShowAddToCart(true);
  };

  return (
    <div
      className={`max-w-[99.5%] mx-auto flex flex-col lg:flex-row items-center p-6 my-4 md:my-1 rounded-lg h-full overflow-y-auto overflow-x-hidden select-none justify-center ${theme.mainTheme}`}
    >
      {/* Customization panel (Left Side) */}
      <Resizable
        key={isMobile ? "mobile" : "desktop"} // force remount on mobile/desktop swap
        defaultSize={
          isMobile
            ? { width: "100%", height: `${height}` }
            : { width: `${width}%`, height: "full" }
        }
        minWidth={isMobile ? "100%" : "40%"}
        maxWidth={isMobile ? "100%" : "50%"}
        minHeight={isMobile ? "30vh" : "full"}
        maxHeight={isMobile ? "30vh" : "full"}
        enable={!isMobile && { right: true }}
        onResizeStop={(e, direction, ref, d) => {
          if (isMobile) {
            setHeight(`${parseFloat(height) + d.height}px`);
          } else {
            setWidth(width + d.width);
          }
        }}
        className={`p-6 rounded-lg overflow-y-auto overflow-x-hidden ${
          isMobile ? "mb-1" : "h-full"
        } ${theme.mainTheme}`}
      >
        <FloatingInfoBubble
          text="Colors, and fabrics may appear differently in real life"
          type="warning"
          extraClasses="mb-4"
          icon={<i className="fas fa-exclamation-circle"></i>}
        />
        {/* Morph sliders for each outfit */}
        {Object.keys(morphTargets).map((outfit) => (
          <div key={outfit} className="mb-4 border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">{outfit}</h3>
            {morphTargets[outfit]?.map((target, index) => (
              <div key={`${outfit}-${index}`} className="mb-3">
                <label className="block text-sm font-medium">{target}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={morphValues[outfit]?.[index] || 0}
                  onChange={(e) =>
                    handleMorphChange(outfit, index, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-blue-500 
             [&::-webkit-slider-thumb]:appearance-none 
             [&::-webkit-slider-thumb]:w-4 
             [&::-webkit-slider-thumb]:h-4 
             [&::-webkit-slider-thumb]:bg-blue-500 
             [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            ))}

            <FloatingInfoBubble
              text="Upload a picture of a fabric to apply as texture to the outfit"
              type="info"
              icon={<i className="fas fa-exclamation-circle"></i>}
              extraClasses="mb-2"
            />

            <div className="flex items-center justify-between mb-6">
              {/* Color Picker Button on the left */}
              <SimpleButton
                btnText={selectedOutfit === outfit ? "Hide" : "Color Picker"}
                type={"primary"}
                onClick={() => {
                  if (selectedOutfit === outfit) {
                    setSelectedOutfit(null); // If the same outfit is clicked, hide the picker
                  } else {
                    setSelectedOutfit(outfit); // Show the picker for this outfit
                  }
                }}
              />

              {/* Texture image input on the right */}
              <div className="flex items-center">
                <label
                  htmlFor={`file-input-${outfit}`}
                  className={`px-4 py-2 rounded cursor-pointer hover:ring-2 ${theme.mainTheme} ${theme.hoverBg}`}
                >
                  {texture[outfit] ? "Change Texture" : "Choose a Texture"}
                </label>
                <input
                  id={`file-input-${outfit}`}
                  type="file"
                  accept=".jpg, jpeg, .png"
                  onChange={(e) => handleTextureUpload(outfit, null, e)}
                  className="hidden" // Hide the default input element
                />
              </div>
              {["KameezShalwar", "FemaleGown"].includes(outfit) && (
                <div className="flex items-center">
                  <label
                    htmlFor={`file-shalwar-${outfit}`}
                    className={`px-4 py-2 rounded cursor-pointer hover:ring-2 ${theme.mainTheme} ${theme.hoverBg}`}
                  >
                    {texture[outfit] ? "Change Bottom" : "Bottom Texture"}
                  </label>
                  <input
                    id={`file-shalwar-${outfit}`}
                    type="file"
                    accept=".jpg, .png"
                    onChange={(e) => handleTextureUpload(outfit, "shalwar", e)}
                    className="hidden" // Hide the default input element
                  />
                </div>
              )}
            </div>

            {/* Color Picker */}
            {selectedOutfit === outfit && (
              <ColorPicker
                onColorChange={(color) =>
                  handleColorPickerChange(outfit, color)
                } // Pass the outfit name along with the color
              />
            )}

            {/* Button Texture Selector */}
            {hasButtonsTypes.includes(outfit) && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-semibold mb-2">
                  Choose Button Style for {outfit}
                </h4>
                <ButtonSelector
                  onSelect={(texturePath) => {
                    setbuttonTexturePath(texturePath);
                  }}
                />
              </div>
            )}

            {outfit === "KameezShalwar" && (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-semibold mb-2">
                  Choose Collar Type for {outfit}
                </h4>
                <SimpleButton
                  btnText={collarVisible ? "Double Collar" : "Band Collar"}
                  extraclasses={`mt-3`}
                  type={collarVisible ? "primary" : "default"}
                  onClick={() => setCollarVisible(!collarVisible)}
                />
              </div>
            )}
          </div>
        ))}

        {/* Skin Tone slider */}
        <div className={`border-b pb-5 ${theme.colorBorder}`}>
          <h3 className="text-lg font-semibold my-3">Model</h3>
          <h3 className="text-sm font-medium">Skin Tone</h3>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={colorValue}
            onChange={(e) => setColorValue(parseFloat(e.target.value))}
            className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-blue-500 
               [&::-webkit-slider-thumb]:appearance-none 
               [&::-webkit-slider-thumb]:w-4 
               [&::-webkit-slider-thumb]:h-4 
               [&::-webkit-slider-thumb]:bg-blue-500 
               [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        {userLoggedIn && (
          <div className="flex flex-col mt-5 space-y-3">
            {!linkGenerated ? (
              <div className="space-y-2">
                <span>Generate customized outfit sharing link</span>
                <SimpleButton
                  btnText={
                    generatingLink ? (
                      <>
                        <LoadingSpinner size={24} />
                        <span className="ml-2">Generating...</span>
                      </>
                    ) : (
                      "Generate"
                    )
                  }
                  type="default"
                  onClick={uploadCustomization}
                  disabled={generatingLink}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <span>
                  Link Generated{" "}
                  <i className="fas fa-check ml-3 font-bold text-lg text-green-500" />
                </span>
                <ShareLinkDialog
                  sender={userData}
                  shareLink={shareLink}
                  subject="Custom Outfit"
                />
              </div>
            )}
            {showActionButtons && (
              <div className="flex space-x-2">
                <SimpleButton
                  btnText={
                    <>
                      <i className="fas fa-shopping-cart mr-2" />
                      Add to Cart
                    </>
                  }
                  type="accent"
                  onClick={async () => {
                    if (!linkGenerated) {
                      await uploadCustomization();
                    }
                    handleAddToCart();
                  }}
                />
                <SimpleButton
                  btnText={
                    <>
                      <i className="fas fa-bolt mr-2" />
                      Buy Now
                    </>
                  }
                  type="primary"
                  onClick={handleBuyNow}
                />
              </div>
            )}
          </div>
        )}
      </Resizable>

      {/* Preview panel (Right Side) */}
      <div
        className={`w-full md:w-[${
          100 - width
        }%] h-[80%] md:h-[100%] flex justify-center items-center`}
      >
        <CustomizationScene
          outfitTypes={uniqueOutfits}
          morphValues={morphValues}
          setMorphValues={handleSetMorphValues}
          setMorphTargets={handleSetMorphTargets}
          colorValue={colorValue}
          texture={texture}
          color={color}
          gender={selectedGender}
          buttonTexturePath={buttonTexturePath}
          shalwarTexurePath={shalwarTexure}
          collarVisible={collarVisible}
        />
      </div>
      {showAddToCart && product && (
        <AddToCart
          product={{
            ...product,
            products: {
              ...product.products,
            },
          }}
          onClose={() => setShowAddToCart(false)}
          theme={theme}
          customizedProductLink={shareLink}
          userId={userData?.uid}
        />
      )}
    </div>
  );
};

export default OutfitCustomization;
