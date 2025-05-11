"use client";
import React, { createContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Create the context
export const UserContext = createContext();

// Create the provider component
export const UserProvider = ({ children }) => {
  // Initialize the theme
  const [theme, setTheme] = useState(null); // Initialize as `null` to indicate data is loading
  const [userData, setUserData] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isReady, setIsReady] = useState(false); // Track readiness of app
  const [popUpMessageTrigger, setPopUpMessageTrigger] = useState(false);
  const [showMessage, setShowMessage] = useState({
    type: "",
    message: "",
  });
  const [activeDashboard, setActiveDashboard] = useState("user");
  const [loadingUserData, setLoadingUserData] = useState(true);

  const themes = {
    midnightWhisper: {
      themeName: "midnightWhisper",
      mainTheme: "midnight-whisper",
      bgImage: "url(/background_images/background-23.jpg)",
      colorText: "text-gray-100",
      colorBorder: "border-gray-100",
      iconColor: "text-blue-500",
      hoverText: "hover:text-blue-400",
      colorBg: "bg-slate-700 backdrop-blur-xl bg-opacity-90",
      hoverBg: "hover:bg-indigo-300 hover:bg-opacity-30",
      hoverShadow: "hover:shadow-md hover:shadow-amber-300",
      subTextColor: "text-gray-300",
    },
    lunarGlow: {
      themeName: "lunarGlow",
      mainTheme: "lunar-glow",
      bgImage: "url(/background_images/ex-backgroundDefaultBlue.jpg)",
      colorText: "text-black",
      colorBorder: "border-black",
      iconColor: "text-blue-600",
      hoverText: "hover:text-gray-700",
      colorBg: "bg-gray-300 backdrop-blur-xl bg-opacity-85",
      hoverBg: "hover:bg-gray-500 hover:bg-opacity-80",
      hoverShadow: "hover:shadow-md hover:shadow-gray-800",
      subTextColor: "text-gray-600",
    },
    neonPunk: {
      themeName: "neonPunk",
      mainTheme: "neon-punk",
      bgImage: "url(/background_images/backgroundRedPurple.jpg)",
      colorText: "text-yellow-400",
      colorBorder: "border-pink-600",
      iconColor: "text-yellow-500",
      hoverText: "hover:text-rose-600",
      colorBg: "bg-sky-800 backdrop-blur-xl bg-opacity-70",
      hoverBg: "hover:bg-rose-400 hover:bg-opacity-50",
      hoverShadow: "hover:shadow-md hover:shadow-violet-500",
      subTextColor: "text-orange-300",
    },
  };

  const handleSetTheme = (themeName) => {
    if (themeName === "systemDefault") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? themes.midnightWhisper : themes.lunarGlow);
    } else {
      setTheme(themes[themeName]);
    }
  };

  // Function to update active dashboard and persist it
  const updateActiveDashboard = (dashboardType) => {
    setActiveDashboard(dashboardType);
    // Update in storage if user is logged in
    if (userLoggedIn && userData) {
      const updatedUserData = { ...userData, activeDashboard: dashboardType };
      setUserData(updatedUserData);
      // Update in both storage locations if they exist
      if (localStorage.getItem("userData")) {
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
      }
      if (sessionStorage.getItem("userData")) {
        sessionStorage.setItem("userData", JSON.stringify(updatedUserData));
      }
    }
  };

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== "undefined") {
      // Fetch theme
      const savedTheme = localStorage.getItem("TailorEaseTheme");
      handleSetTheme(savedTheme ? JSON.parse(savedTheme) : "systemDefault");

      // Fetch user data
      const savedUser =
        sessionStorage.getItem("userData") || localStorage.getItem("userData");
      const parsedUser = savedUser
        ? JSON.parse(savedUser)
        : {
            uid: "",
            fullName: "",
            email: "",
            phone: "",
            age: "",
            gender: "",
            countryCode: "",
            bId: "",
            activeDashboard: "",
          };

      // Set active dashboard from storage if available
      if (parsedUser.activeDashboard) {
        setActiveDashboard(parsedUser.activeDashboard);
      }

      setUserData(parsedUser);
      setUserLoggedIn(!!parsedUser.uid);
      setIsReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const auth = getAuth();
    // Subscribe to auth changes; unsubscribe on unmount
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Tell UI we’re signed-in
        setUserLoggedIn(true);

        // Pull full profile from Firestore where field uid == fbUser.uid
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", fbUser.uid));
        const snap = await getDocs(q);

        // Build fresh userData
        let freshData = {
          uid: "",
          fullName: "",
          email: "",
          phone: "",
          age: "",
          gender: "",
          countryCode: "",
          bId: "",
        };

        if (!snap.empty) {
          const d = snap.docs[0].data();
          freshData = {
            uid: fbUser.uid,
            fullName: d.fullName || "",
            email: d.email || "",
            phone: d.phone || "",
            age: d.age || "",
            gender: d.gender || "",
            countryCode: d.countryCode || "",
            bId: d.bId || "",
          };
        }

        // Overwrite context + storage
        setUserData(freshData);
        localStorage.setItem("userData", JSON.stringify(freshData));
        sessionStorage.setItem("userData", JSON.stringify(freshData));
      } else {
        // Signed out: clear everything
        setUserLoggedIn(false);
        setUserData(null);
        setUserLoggedIn(false);
        setActiveDashboard("");
        localStorage.removeItem("userData");
        sessionStorage.removeItem("userData");
      }
      setLoadingUserData(false);
    });

    return unsubscribe; // clean up listener on unmount
  }, []);

  // Show a loader until the app is ready
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const inputStyles = `w-full p-1 mt-4 peer ${
    theme?.colorText || "text-gray-800"
  } border-b-2 z-10 ${
    theme?.colorBorder || "border-gray-800"
  } outline-none focus:border-blue-500 transition-all duration-300 bg-transparent`;

  const placeHolderStyles = `absolute top-5 pointer-events-none left-1 ${
    theme?.colorText || "text-gray-800"
  } duration-300 transform -translate-y-7 scale-75 origin-left peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:${
    theme?.colorText || "text-gray-800"
  } peer-focus:-translate-y-7 peer-focus:scale-80 peer-focus:text-blue-800`;

  return (
    <UserContext.Provider
      value={{
        setUserData,
        setShowMessage,
        handleSetTheme,
        setPopUpMessageTrigger,
        setUserLoggedIn,
        setTheme,
        updateActiveDashboard,
        activeDashboard,
        theme,
        userData,
        userLoggedIn,
        popUpMessageTrigger,
        showMessage,
        inputStyles,
        placeHolderStyles,
        loadingUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
