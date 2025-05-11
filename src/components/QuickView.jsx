"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SimpleButton from "../components/SimpleButton";
import { useRouter } from "next/navigation";
import Image from "next/image";

const QuickView = ({ theme, tailor, setPopupVisible, popupVisible }) => {
  const [showPopUp, setShowPopUp] = useState(popupVisible);
  const popupRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setShowPopUp(popupVisible);
  }, [popupVisible]);

  const rating = tailor?.rating || 0;
  const totalRating = tailor?.total_rating || 0;

  const normalizedRating = totalRating ? (rating / totalRating) * 5 : 0;
  const reviewCount = totalRating ? Math.floor(totalRating / 6) : 0;

  const handleClose = useCallback(() => {
    setShowPopUp(false);
    setTimeout(() => {
      setPopupVisible(false);
    }, 300);
  }, [setShowPopUp, setPopupVisible]);

  const handleOutsideClick = (e) => {
    if (popupRef.current && !popupRef.current.contains(e.target)) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  useEffect(() => {
    if (tailor) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [tailor]);

  const handleViewProfile = () => {
    router.push(`/tailors/profile/${tailor.id}`);
  };

  // Enhanced animations
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.33, 1, 0.68, 1],
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.33, 1, 0.68, 1],
      },
    },
  };

  const popupVariants = {
    hidden: {
      scale: 0.96,
      opacity: 0,
      y: 20,
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.33, 1, 0.68, 1],
      },
    },
    exit: {
      scale: 0.96,
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.3,
        ease: [0.33, 1, 0.68, 1],
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 + i * 0.05,
        duration: 0.4,
        ease: [0.33, 1, 0.68, 1],
      },
    }),
  };

  const starVariants = {
    hidden: { scale: 0.6, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.3 + i * 0.07,
        type: "spring",
        stiffness: 500,
        damping: 15,
      },
    }),
  };

  return (
    <AnimatePresence>
      {showPopUp && (
        <>
          {/* Backdrop with perfect easing */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
          />

          {/* Main popup container with reduced height */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              className="w-full max-w-md"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={popupVariants}
            >
              <div
                ref={popupRef}
                className={`p-5 rounded-xl shadow-xl ${theme.colorBg} border ${theme.colorBorder} max-h-[80vh] overflow-y-auto`}
              >
                {/* Header with close button */}
                <div className="flex justify-between items-start mb-4">
                  <motion.h3
                    className={`text-xl font-bold ${theme.colorText} line-clamp-2`}
                    variants={itemVariants}
                    custom={0}
                    initial="hidden"
                    animate="visible"
                  >
                    {tailor.businessName}
                  </motion.h3>

                  <motion.button
                    onClick={handleClose}
                    className={`text-lg ${theme.colorText} ${theme.hoverText} rounded-full p-1`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    variants={itemVariants}
                    custom={0.2}
                    initial="hidden"
                    animate="visible"
                  >
                    <i className="fas fa-times"></i>
                  </motion.button>
                </div>

                {/* Profile section with 3:2 image ratio */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 mb-5"
                  variants={itemVariants}
                  custom={0.4}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div
                    className="relative w-full aspect-[3/2] sm:w-36 rounded-lg overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Image
                      src={
                        tailor.businessPictureUrl ||
                        "/images/profile/business/default.png"
                      }
                      fill
                      alt={`Image of ${tailor.businessName}`}
                      className="object-cover"
                      priority={false}
                      placeholder="blur"
                      blurDataURL="/images/profile/business/default.png"
                    />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <motion.div
                      className="grid grid-cols-2 gap-2"
                      variants={itemVariants}
                      custom={0.6}
                      initial="hidden"
                      animate="visible"
                    >
                      <div
                        className={`p-2 rounded-lg ${theme.hoverBg} border ${theme.colorBorder}`}
                      >
                        <p
                          className={`text-xs font-medium ${theme.colorText} mb-1`}
                        >
                          Experience
                        </p>
                        <p className={`text-sm font-bold ${theme.iconColor}`}>
                          {tailor.experience} yrs
                        </p>
                      </div>

                      <div
                        className={`p-2 rounded-lg ${theme.hoverBg} border ${theme.colorBorder}`}
                      >
                        <p
                          className={`text-xs font-medium ${theme.colorText} mb-1`}
                        >
                          Hours
                        </p>
                        <p className={`text-sm font-bold ${theme.iconColor}`}>
                          {tailor.openTime}-{tailor.closeTime}
                        </p>
                      </div>

                      <div
                        className={`p-2 rounded-lg ${theme.hoverBg} border ${theme.colorBorder} col-span-2`}
                      >
                        <p
                          className={`text-xs font-medium ${theme.colorText} mb-1`}
                        >
                          Address
                        </p>
                        <p
                          className={`text-xs ${theme.iconColor} line-clamp-2`}
                        >
                          {tailor.businessAddress}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Specialities */}
                <motion.div
                  className="mb-5"
                  variants={itemVariants}
                  custom={0.8}
                  initial="hidden"
                  animate="visible"
                >
                  <p className={`text-sm font-bold ${theme.colorText} mb-2`}>
                    Specialities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tailor.specialities?.length > 0 ? (
                      tailor.specialities.map((speciality, index) => (
                        <motion.span
                          key={index}
                          className={`px-3 py-1 ${theme.colorText} ${theme.hoverBg} rounded-full text-xs font-medium border ${theme.colorBorder}`}
                          variants={itemVariants}
                          custom={0.8 + index * 0.05}
                          initial="hidden"
                          animate="visible"
                          whileHover={{
                            y: -2,
                            boxShadow: `0 2px 4px rgba(0,0,0,0.1)`,
                          }}
                        >
                          {speciality}
                        </motion.span>
                      ))
                    ) : (
                      <span className={`text-xs ${theme.colorText}`}>
                        No specialities listed
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Rating */}
                <motion.div
                  className="mb-5"
                  variants={itemVariants}
                  custom={1}
                  initial="hidden"
                  animate="visible"
                >
                  <p className={`text-sm font-bold ${theme.colorText} mb-2`}>
                    Rating
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star, i) => (
                        <motion.span
                          key={i}
                          className={`text-xl ${
                            i < Math.floor(normalizedRating)
                              ? "text-yellow-500"
                              : theme.iconColor
                          }`}
                          variants={starVariants}
                          custom={i}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ scale: 1.2 }}
                        >
                          {i < Math.floor(normalizedRating) ? "★" : "☆"}
                        </motion.span>
                      ))}
                    </div>
                    <span className={`text-sm font-bold ${theme.colorText}`}>
                      {normalizedRating.toFixed(1)}
                    </span>
                  </div>
                  <motion.p
                    className={`text-xs mt-1 ${theme.colorText}`}
                    whileHover={{ x: 3 }}
                  >
                    {reviewCount || 0}{" "}
                    {reviewCount === 1 ? "review" : "reviews"}
                  </motion.p>
                </motion.div>

                {/* View Profile Button */}
                <motion.div
                  variants={itemVariants}
                  custom={1.2}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SimpleButton
                    btnText={"View Profile"}
                    type="primary-submit"
                    extraclasses={`w-full py-2 text-sm`}
                    onClick={handleViewProfile}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickView;
