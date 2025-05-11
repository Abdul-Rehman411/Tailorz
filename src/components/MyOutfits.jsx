"use client";
import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import UserContext from "@/utils/UserContext";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import ClipLoader from "react-spinners/ClipLoader";

const dummyThumbnail = "/images/assets/dummy-outfit.png";

const MyOutfits = () => {
  const { theme, userData, setShowMessage, setPopUpMessageTrigger } =
    useContext(UserContext);
  const [outfits, setOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOutfits = async () => {
      if (!userData?.uid) return;

      try {
        setIsLoading(true);
        const q = query(
          collection(db, "myOutfits"),
          where("userId", "==", userData.uid)
        );
        const querySnapshot = await getDocs(q);

        const fetchedOutfits = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOutfits(fetchedOutfits);
      } catch (err) {
        console.error("Error fetching outfits:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutfits();
  }, [userData?.uid]);

  const handleDeleteOutfit = async (id) => {
    if (!id) return;

    try {
      await deleteDoc(doc(db, "myOutfits", id));
      setOutfits((prevOutfits) => prevOutfits.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Error deleting outfit:", err);
    }
  };

  const handleShareOutfit = async (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setShowMessage({ message: "Link copied to clipboard!", type: "success" });
      setPopUpMessageTrigger(true);
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        delay: index * 0.25,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className={`p-4 ${theme?.text}`}>
      <h3 className="text-3xl font-bold text-center mb-6">
        My Customized Outfits
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <ClipLoader color="#fff" size={45} />
        </div>
      ) : outfits.length === 0 ? (
        <p className="text-sm text-center">
          No outfits yet. Start by visiting{" "}
          <a href="/market" className="text-blue-600 font-bold">
            Market
          </a>{" "}
          and selecting an outfit
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {outfits.map((outfit, index) => {
            const textures = Object.values(outfit.texture || {});
            const outfitName = outfit.outfitNames || "Unnamed Outfit";

            return (
              <motion.a
                key={index}
                href={`${outfit.link}${outfit.id}`}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                whileHover={{ scale: 1.03 }}
                className={`relative rounded-lg overflow-hidden border shadow-md cursor-pointer ${theme?.colorBg} group`}
                style={{
                  height: "16rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {(textures.length > 0 ? textures : [dummyThumbnail]).map(
                  (imgUrl, i) => (
                    <div
                      key={`texture-${i}`}
                      className="relative"
                      style={{ flex: 1, width: "100%" }}
                    >
                      <Image
                        src={imgUrl}
                        alt={`Texture ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        priority={i === 0}
                      />
                    </div>
                  )
                )}

                {outfit.shalwarTexureURL && (
                  <div className="relative" style={{ flex: 1, width: "100%" }}>
                    <Image
                      src={outfit.shalwarTexureURL}
                      alt="Shalwar Texture"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      priority={false}
                    />
                  </div>
                )}
                <div className="absolute bottom-0 w-full bg-black bg-opacity-60 text-white text-sm px-2 py-1 text-center truncate z-10">
                  {outfitName}
                </div>

                {/* Delete button */}
                <div className="md:hidden block md:group-hover:block absolute w-10 h-10 right-10 top-0 bg-red-100 hover:bg-red-400 shadow-lg rounded-full z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteOutfit(outfit.id);
                    }}
                    className="px-[14px] py-[10px] text-sm text-red-900 w-full h-full"
                  >
                    <i className="fas fa-trash"> </i>
                  </button>
                </div>
                <div className="md:hidden block md:group-hover:block absolute top-0 right-0 w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-800 py-2 text-white text-center z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleShareOutfit(outfit.link + outfit.id);
                    }}
                    className="w-full h-full"
                  >
                    <i className="fas fa-share"></i>
                  </button>
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOutfits;
