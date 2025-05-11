"use client";
import React, { useContext, useState, useEffect, useRef, act } from "react";
import Logo from "./Logo";
import SimpleButton from "./SimpleButton";
import { auth } from "@/utils/firebaseConfig";
import { signOut } from "firebase/auth";
import UserContext from "@/utils/UserContext";
import { useRouter } from "next/navigation";
import DialogBox from "./DialogBox";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { MenuIcon } from "../../public/icons/svgIcons";
import CompleteProfileModal from "./CompleteProfileModal";

const Navbar = () => {
  const {
    userData,
    theme,
    userLoggedIn,
    setUserLoggedIn,
    setShowMessage,
    setPopUpMessageTrigger,
    handleSetTheme,
    activeDashboard,
    updateActiveDashboard,
    setUserData,
  } = useContext(UserContext);

  const [userFullName, setUserFullName] = useState(userData?.fullName || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isVerifiedTailor, setIsVerifiedTailor] = useState(false);
  const [profileComplete, setProfileComplete] = useState(true);
  const [windowWidth, setWindowWidth] = useState(undefined);
  const [windowHeight, setWindowHeight] = useState(undefined);
  const [selectedTab, setSelectedTab] = useState(null);

  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (activeDashboard === "user") {
      setSelectedTab("Dashboard");
    } else {
      setSelectedTab("Profile");
    }
  }, [activeDashboard]);
  // Check if user is a verified tailor
  useEffect(() => {
    const checkTailorStatus = async () => {
      if (!userLoggedIn || !userData?.uid) {
        setIsVerifiedTailor(false);
        return;
      }

      try {
        const tailorsRef = collection(db, "tailors");
        const q = query(tailorsRef, where("ownerId", "==", userData.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const tailorData = querySnapshot.docs[0].data();
          const isTailor = tailorData.approved === true;
          setIsVerifiedTailor(isTailor);
        } else {
          setIsVerifiedTailor(false);
        }
      } catch (error) {
        console.error("Error checking tailor status:", error);
        setIsVerifiedTailor(false);
      }
    };

    checkTailorStatus();
  }, [userLoggedIn, userData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userData");
      sessionStorage.removeItem("userData");
      setUserLoggedIn(false);
      setDropdownOpen(false);
      setIsVerifiedTailor(false);
      updateActiveDashboard("user");
      setShowMessage({
        type: "success",
        message: "Logged out!",
      });
      setPopUpMessageTrigger("true");
      router.replace("/login");
      setTimeout(() => {
        setUserData(null);
      }, 3000);
    } catch (error) {
      setShowMessage({
        type: "danger",
        message: "Couldn't log out. Please try again!",
      });
      setPopUpMessageTrigger("true");
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (userData?.fullName) {
      setUserFullName(userData?.fullName);
    }
  }, [userData]);

  useEffect(() => {
    if (userLoggedIn) {
      if (!userData?.phone || !userData?.age || !userData?.gender) {
        setTimeout(() => {
          setProfileComplete(false);
        }, 3000);
      }
    }
  }, [userData, userLoggedIn]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const switchToTailorDashboard = () => {
    if (isVerifiedTailor) {
      updateActiveDashboard("tailor");
      router.replace("/business-dashboard/profile");
      setDropdownOpen(false);
    }
  };

  const switchToUserDashboard = () => {
    updateActiveDashboard("user");
    router.replace("/user");
    setDropdownOpen(false);
  };

  const themeOptions = [
    {
      value: "systemDefault",
      label: "System Default",
      style:
        "background-gradient text-white shadow-md shadow-gray-800 hover:bg-gray-700 hover:bg-opacity-90",
    },
    {
      value: "midnightWhisper",
      label: "Midnight Whisper",
      style: "midnight-whisper hover:bg-gray-700 hover:bg-opacity-90",
    },
    {
      value: "lunarGlow",
      label: "Lunar Glow",
      style: "lunar-glow hover:bg-gray-400 hover:bg-opacity-90",
    },
    {
      value: "neonPunk",
      label: "Neon Punk",
      style: "neon-punk hover:bg-rose-400 hover:bg-opacity-90",
    },
  ];

  const handleThemeChange = (themeName) => {
    handleSetTheme(themeName);
  };

  const handleSaveTheme = () => {
    localStorage.setItem("TailorEaseTheme", JSON.stringify(theme.themeName));
    setShowMessage({
      type: "success",
      message: "Theme applied!",
    });
    setPopUpMessageTrigger(true);
    setShowDialog(false);
  };

  const dialogButtons = [
    {
      label: "Save Theme",
      onClick: handleSaveTheme,
      type: "primary",
    },
  ];

  // Common dropdown options
  const commonDropdownOptions = [
    {
      text: "Theme",
      icon: <i className="fas fa-palette fa-fw" />,
      onClick: () => {
        setShowDialog(true);
      },
    },
  ];

  // Visitor dropdown options
  const visitorDropdownOptions = [
    ...commonDropdownOptions,
    {
      text: "Login",
      icon: <i className="fas fa-sign-in-alt fa-fw" />,
      onClick: () => {
        router.replace("/login");
        setSelectedTab("Login");
        setDropdownOpen(false);
      },
    },
  ];

  // User dropdown options (shown when in user dashboard)
  const userDropdownOptions = [
    ...commonDropdownOptions,
    {
      text: "Logout",
      icon: <i className="fas fa-sign-out-alt fa-fw text-red-700" />,
      onClick: () => {
        handleLogout();
        setSelectedTab("Login");
      },
    },
    {
      text: "Settings",
      icon: <i className="fas fa-cog fa-fw" />,
      onClick: () => {
        setSelectedTab("Settings");
        router.replace("/settings");
        setDropdownOpen(false);
      },
    },
    isVerifiedTailor && {
      text: "Tailor",
      icon: <i className="fas fa-scissors fa-fw" />,
      onClick: switchToTailorDashboard,
    },
  ].filter(Boolean);

  // Tailor dropdown options (shown when in tailor dashboard)
  const tailorDropdownOptions = [
    ...commonDropdownOptions,
    {
      text: "Logout",
      icon: <i className="fas fa-sign-out-alt fa-fw text-red-700" />,
      onClick: handleLogout,
    },
    {
      text: "Settings",
      icon: <i className="fas fa-cog fa-fw" />,
      onClick: () => {
        setSelectedTab("Settings");
        router.replace("/settings");
        setDropdownOpen(false);
      },
    },
    {
      text: "User",
      icon: <i className="fas fa-user fa-fw" />,
      onClick: switchToUserDashboard,
    },
  ];

  // Visitor navigation items
  const visitorNavItems = [
    {
      path: "/",
      icon: <i className="fas fa-home" />,
      label: "Home",
    },
    {
      path: "/market",
      icon: <i className="fas fa-shopping-cart" />,
      label: "Market",
    },
    {
      path: "/tailors",
      icon: <i className="fas fa-scissors" />,
      label: "All Tailors",
    },
    {
      path: "/contact-us",
      icon: <i className="fas fa-envelope" />,
      label: "Contact",
    },
    {
      path: "/about-us",
      icon: <i className="fas fa-info-circle" />,
      label: "About",
    },
  ];

  // User dashboard navigation items
  const userDashboardNavItems = [
    {
      path: "/user?tab=profile",
      icon: <i className="fas fa-user" />,
      label: "Dashboard",
    },
    {
      path: "/market",
      icon: <i className="fas fa-shopping-cart" />,
      label: "Market",
    },
    {
      path: "/tailors",
      icon: <i className="fas fa-scissors" />,
      label: "All Tailors",
    },
    {
      path: "/contact-us",
      icon: <i className="fas fa-envelope" />,
      label: "Contact",
    },
    !isVerifiedTailor && {
      path: "/become-tailor",
      icon: <i className="fas fa-scissors" />,
      label: "Become Tailor",
    },
  ].filter(Boolean);

  // Tailor dashboard navigation items
  const tailorDashboardNavItems = [
    {
      path: "/business-dashboard/profile",
      icon: <i className="fas fa-user" />,
      label: "Profile",
    },
    {
      path: "/business-dashboard/products",
      icon: <i className="fas fa-box-open" />,
      label: "Products",
    },
    {
      path: "/business-dashboard/orders",
      icon: <i className="fas fa-clipboard-list" />,
      label: "Orders",
    },
    {
      path: "/business-dashboard/analytics",
      icon: <i className="fas fa-chart-line" />,
      label: "Analytics",
    },
    {
      path: "/business-dashboard/wallet",
      icon: <i className="fas fa-money-bill-wave" />,
      label: "Wallet",
    },
  ];

  // Determine which navigation items to use
  const getNavItems = () => {
    if (!userLoggedIn) return visitorNavItems;
    if (activeDashboard === "tailor") return tailorDashboardNavItems;
    return userDashboardNavItems;
  };

  // Determine which dropdown options to use
  const getDropdownOptions = () => {
    if (!userLoggedIn) return visitorDropdownOptions;
    if (activeDashboard === "tailor") return tailorDropdownOptions;
    return userDropdownOptions;
  };

  const navItems = getNavItems();
  const dropdownOptions = getDropdownOptions();
  const animate = windowWidth >= 768 ? 10 : -10;
  const linkStyles = `flex items-center justify-center md:justify-start cursor-pointer px-4 py-2 rounded-xl w-auto md:w-full duration-500 ${
    theme?.hoverBg || ""
  }`;

  return (
    <div className="flex">
      <nav
        className={`flex-shrink-0 fixed top-0 md:left-0 h-24 md:h-screen w-screen md:w-40 rounded-md ${
          theme?.mainTheme || ""
        }`}
      >
        <div className="justify-between h-full">
          <div>
            <div
              className={`flex md:block h-12 md:h-auto justify-between mt-1`}
            >
              <Logo
                classes={`md:my-5 my-1 max-w-16 md:max-w-full items-center justify-center`}
                onClick={() => {
                  setSelectedTab(null);
                }}
              />
              {userLoggedIn ? (
                <div className="py-1 mt-3 text-center mx-3 sm:mx-5 md:mx-0 select-none">
                  <span>{userFullName && userFullName}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <SimpleButton
                    onClick={() => {
                      router.replace("/login");
                      setSelectedTab("Login");
                    }}
                    btnText={"Log In"}
                    type={"simple"}
                    extraclasses="w-full mx-2"
                    icon={<i className="fas fa-sign-in-alt" />}
                  />
                </div>
              )}
            </div>
            <div
              className={`flex items-center justify-between ${
                windowHeight >= 500 ? "md:mt-10" : "md:mt-3"
              }`}
            >
              <ul className="md:space-y-2 justify-evenly select-none w-full md:inline grid grid-flow-col">
                {navItems.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      router.replace(item.path);
                      setSelectedTab(item.label);
                    }}
                    className={`${linkStyles} ${
                      selectedTab === item.label ? theme.colorBg : ""
                    }`}
                  >
                    <span className="text-lg mr-2">{item.icon}</span>
                    <span className={"hidden md:inline-block"}>
                      {item.label}
                    </span>
                  </li>
                ))}
                <div>
                  <div
                    className={`relative md:absolute md:bottom-1 w-full rounded-xl ${
                      windowWidth >= 768 &&
                      windowHeight <= 400 &&
                      theme?.colorBg
                    }`}
                  >
                    <div
                      className={linkStyles}
                      ref={dropdownRef}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <div className="flex">
                        <span className="flex items-center select-none">
                          <MenuIcon
                            color={`${theme?.iconColor || ""}`}
                            extraClasses={"mt-1"}
                          />
                          <span className={"hidden md:inline-block ml-2"}>
                            Menu
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            className={`absolute w-auto md:w-40 z-50 py-2 rounded-md ${
              windowWidth >= 768
                ? "md:bottom-[45px]"
                : "right-1 top-[100px] px-2 py-2 " + theme?.colorBg
            } ${windowHeight <= 730 && theme?.colorBg}`}
            initial={{ opacity: 0, y: animate }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: animate }}
            transition={{ duration: 0.3 }}
          >
            <motion.ul
              className={`md:space-y-2 justify-center select-none w-full`}
              initial={{ opacity: 0, y: animate }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: animate }}
              transition={{ duration: 0.3 }}
            >
              {dropdownOptions.map((option, index) => (
                <li
                  key={index}
                  onClick={option.onClick}
                  className={`justify-between ${linkStyles} ${
                    theme?.colorText || ""
                  } ${selectedTab === option.text ? theme.colorBg : ""}`}
                >
                  <span className="text-lg mr-2">{option.icon}</span>
                  <span>{option.text}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
      <DialogBox
        showDialog={showDialog}
        setShowDialog={setShowDialog}
        title="Choose Theme"
        body={
          <div className="flex">
            {themeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleThemeChange(option.value)}
                className={`mx-1 rounded-lg w-1/4 py-8 px-[26px] md:px-3 ${option.style}`}
              >
                <span className="hidden md:inline">{option.label}</span>
              </button>
            ))}
          </div>
        }
        type="info"
        buttons={dialogButtons}
      />
      <CompleteProfileModal
        isVisible={!profileComplete}
        userData={userData}
        onClose={() => setProfileComplete(true)}
      />
    </div>
  );
};

export default Navbar;
