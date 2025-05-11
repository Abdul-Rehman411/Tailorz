"use client";
import React, { useEffect, useState, useContext } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import SimpleButton from "@/components/SimpleButton";
import { motion } from "framer-motion";
import UserContext from "@/utils/UserContext";
import Image from "next/image";
import { ClipLoader } from "react-spinners";

const MyTailors = () => {
  const {
    userLoggedIn,
    userData,
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
  } = useContext(UserContext);
  const [tailorIds, setTailorIds] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch connections then tailor details
  useEffect(() => {
    const fetchConnections = async () => {
      if (!userLoggedIn || !userData?.uid) return;
      setLoading(true);
      try {
        const relQuery = query(
          collection(db, "userTailorConnections"),
          where("userId", "==", userData.uid)
        );
        const relSnap = await getDocs(relQuery);
        const ids = relSnap.docs.map((doc) => doc.data().tailorId);
        setTailorIds(ids);
        // fetch each tailor doc
        const fetches = ids.map(async (id) => {
          const docRef = doc(db, "tailors", id);
          const snap = await getDoc(docRef);
          return snap.exists() ? { id, ...snap.data() } : null;
        });
        const results = await Promise.all(fetches);
        setTailors(results.filter((t) => t));
      } catch (error) {
        console.error("Error loading my tailors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [userLoggedIn, userData?.uid]);

  const handleRemove = async (tailorId) => {
    try {
      const relId = `${tailorId}_${userData.uid}`;
      await deleteDoc(doc(db, "userTailorConnections", relId));
      setTailors((prev) => prev.filter((t) => t.id !== tailorId));
      setShowMessage({ message: "Tailor removed.", type: "success" });
      setPopUpMessageTrigger(true);
    } catch (error) {
      console.error("Remove error:", error);
      setShowMessage({ message: "Failed to remove tailor.", type: "danger" });
      setPopUpMessageTrigger(true);
    }
  };

  const handleShare = (tailorId) => {
    const url = `${window.location.origin}/tailors/profile/${tailorId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowMessage({ message: "Link copied to clipboard!", type: "success" });
      setPopUpMessageTrigger(true);
    });
  };

  const handleView = (tailorId) => {
    window.location.href = `/tailors/profile/${tailorId}`;
  };

  return (
    <div className={`h-full overflow-y-auto rounded-md ${theme.mainTheme}`}>
      <div className="max-w-[99.5%] mx-auto my-4 p-4">
        <h3 className={`text-2xl font-bold mb-4 ${theme.colorText}`}>
          My Tailors
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <ClipLoader size={35} color="white" />
          </div>
        ) : tailors.length === 0 ? (
          <p className={`text-center ${theme.colorText} opacity-70`}>
            No tailors found.
          </p>
        ) : (
          <div className="space-y-4">
            {tailors.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg flex justify-between items-center ${theme.colorBg}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                  {t.businessPictureUrl && (
                    <div className="w-20 h-20 rounded-full overflow-hidden">
                      <div className="relative w-full h-full">
                        <Image
                          src={t.businessPictureUrl}
                          alt={t.businessName}
                          fill
                          className="object-cover"
                          placeholder="blur"
                          blurDataURL="/images/profile/business/default.png"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          priority
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <p className={`font-medium ${theme.colorText}`}>
                      {t.businessName}
                    </p>
                    <p className="text-sm opacity-70">
                      {t.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-end mt-4 lg:mt-0 w-auto">
                  <SimpleButton
                    btnText="View"
                    type="primary"
                    onClick={() => handleView(t.id)}
                  />
                  <SimpleButton
                    btnText="Share"
                    type="default"
                    icon={<i className="fas fa-share-alt"></i>}
                    onClick={() => handleShare(t.id)}
                  />
                  <SimpleButton
                    btnText="Remove"
                    icon={<i className="fas fa-trash"></i>}
                    type="danger"
                    onClick={() => handleRemove(t.id)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTailors;
