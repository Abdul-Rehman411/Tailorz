"use client";
import React, { useState, useEffect, useContext, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClipLoader from "react-spinners/ClipLoader";
import { useSearchParams, useRouter } from "next/navigation";
import UserContext from "@/utils/UserContext";
import BodyMeasurements from "@/components/BodyMeasurements";
import UserProfile from "@/components/UserProfile";
import { db } from "@/utils/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import Footer from "@/components/Footer";

// Lazy-loaded views for dashboard tabs
const MyOrders = lazy(() => import("@/components/MyOrders"));
const MyTailors = lazy(() => import("@/components/MyTailors"));
const MyOutfits = lazy(() => import("@/components/MyOutfits"));

const UserDashboard = () => {
  const { theme, userData, userLoggedIn, loadingUserData } =
    useContext(UserContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get sharedId from the URL for shareable profiles. If it exists, we're in shared mode.
  const sharedId = searchParams.get("share");
  const isSharedMode = sharedId && sharedId !== userData?.uid;

  // For logged in mode, we use the "tab" search parameter; default to "profile"
  const initialTab = searchParams.get("tab") || "profile";

  // State for dashboard mode (ignored if shared mode is active)
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [editAuthShareMode, setEditAuthShareMode] = useState(false);

  // If not in shared mode, ensure the user is logged in; if not, redirect to login page.
  useEffect(() => {
    if (!isSharedMode && !userLoggedIn) {
      router.push("/login");
    }
  }, [userLoggedIn, router, isSharedMode]);

  // Update loading state on tab change (only for dashboard mode)
  useEffect(() => {
    if (!isSharedMode) {
      const delay = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(delay);
    } else {
      setIsLoading(false);
    }
  }, [activeTab, isSharedMode]);

  // Update URL search parameter when activeTab changes (only in dashboard mode)
  useEffect(() => {
    if (!isSharedMode) {
      router.replace(`/user?tab=${activeTab}`);
    }
  }, [activeTab, router, isSharedMode]);

  useEffect(() => {
    const fetchEditMeasurementsAuth = async () => {
      try {
        const q = query(
          collection(db, "userTailorConnections"),
          where("tailorId", "==", userData.bId),
          where("userId", "==", sharedId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setEditAuthShareMode(true);
        } else {
          console.log("No matching document found.");
        }
      } catch (error) {
        console.error("Error fetching connection:", error);
      }
    };

    if (isSharedMode && userData?.bId) {
      fetchEditMeasurementsAuth();
    }
  }, [isSharedMode, userData?.bId, sharedId]);

  // Render content based on active tab in dashboard mode
  if (!isSharedMode && !userLoggedIn) {
    router.push("/login");
    return null; // <-- stops rendering this component entirely
  }
  if (!isSharedMode && userLoggedIn && !userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader color="white" />
      </div>
    );
  }
  const renderContent = () => {
    if (isLoading || loadingUserData) {
      return (
        <div className="flex justify-center items-center h-screen">
          <ClipLoader color="white" />
        </div>
      );
    }
    switch (activeTab) {
      case "orders":
        return <MyOrders />;
      case "tailors":
        return <MyTailors />;
      case "outfits":
        return <MyOutfits />;
      case "profile":
      default:
        return (
          <>
            <UserProfile userData={userData} />
            <BodyMeasurements
              uid={userData?.uid}
              authorization={userLoggedIn}
            />
          </>
        );
    }
  };

  // If we're in shared profile mode, render only the public profile view.
  if (isSharedMode) {
    return (
      <div className="h-full overflow-y-auto">
        <div
          className={`max-w-[99.5%] mx-auto mt-4 mb-14 md:my-1 w-auto p-6 rounded-lg select-none ${theme.mainTheme}`}
        >
          <UserProfile uid={sharedId} />
          <BodyMeasurements uid={sharedId} authorization={editAuthShareMode} />
        </div>
      </div>
    );
  }

  // Render the full dashboard view for logged in users.
  return (
    <div className="h-full overflow-y-auto">
      <div
        className={`max-w-[99.5%] mx-auto mt-4 mb-14 md:my-1 w-auto min-h-screen p-6 rounded-t-lg select-none ${theme.mainTheme}`}
      >
        {/* Top Navbar */}
        <div
          className={`w-full border-b px-4 py-2 flex items-center justify-between ${theme.colorBorder}`}
        >
          <h2 className={`text-xl font-bold ${theme.colorText}`}>Dashboard</h2>
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="focus:outline-none"
          >
            <motion.div
              animate={{ rotate: isNavOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <i className="fas fa-bars text-2xl"></i>
            </motion.div>
          </button>
        </div>

        {/* Animated Top Navigation Tabs */}
        <AnimatePresence>
          {isNavOpen && (
            <motion.div
              className={`w-full border-b ${theme.colorBorder}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row gap-2 p-2 md:p-3">
                {[
                  { key: "profile", label: "Profile", icon: "fas fa-user" },
                  { key: "orders", label: "My Orders", icon: "fas fa-box" },
                  {
                    key: "tailors",
                    label: "My Tailors",
                    icon: "fas fa-scissors",
                  },
                  {
                    key: "outfits",
                    label: "My Outfits",
                    icon: "fas fa-tshirt",
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      if (activeTab !== tab.key) {
                        setIsLoading(true);
                        setActiveTab(tab.key);
                      }
                    }}
                    className={`rounded-2xl py-3 px-6 text-sm font-medium flex items-center gap-2 transition-colors duration-300 ${
                      activeTab === tab.key ? theme.colorBg : "bg-transparent"
                    } ${theme.hoverBg}`}
                  >
                    <i className={tab.icon}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="p-4">
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-20">
                <ClipLoader color="white" />
              </div>
            }
          >
            {renderContent()}
          </Suspense>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserDashboard;
