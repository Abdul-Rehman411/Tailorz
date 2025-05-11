"use client";

import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatBot from "./ChatBot";
import NotificationPanel from "./NotificationPanel";
import UserContext from "@/utils/UserContext";

// Client-side component for toggling panels with animations
export function FloatingButtonsHolder() {
  const { theme } = useContext(UserContext);
  const [hidden, setHidden] = useState(false);

  const slideVariant = {
    hidden: { x: 200, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: {
      x: 200,
      opacity: 0,
      transition: { ease: "easeInOut", duration: 0.3 },
    },
  };

  // Notification with 0.1s delay on hide/unhide
  const notifVariant = {
    hidden: {
      x: 200,
      opacity: 0,
      transition: { delay: 0.1, ease: "easeInOut", duration: 0.3 },
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30, delay: 0.1 },
    },
    exit: {
      x: 200,
      opacity: 0,
      transition: { delay: 0.1, ease: "easeInOut", duration: 0.3 },
    },
  };

  return (
    <>
      {/* Half-circle toggle button */}
      <button
        onClick={() => {
          setTimeout(() => {
            setHidden((prev) => !prev);
          }, 100);
        }}
        className={`fixed bottom-10 right-0 w-7 h-8 ${theme.colorBg} ${theme.hoverBg} text-white flex items-center justify-center opacity-50 hover:opacity-100 shadow-lg focus:outline-none z-[9999] rounded-l-full`}
      >
        <i className={`fas fa-caret-${hidden ? "left" : "right"}`}></i>
      </button>

      <AnimatePresence>
        {!hidden && (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={slideVariant}
              className="fixed bottom-0 right-0 z-[9998]"
            >
              <NotificationPanel />
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={notifVariant}
              className="fixed bottom-0 right-0 z-[9998]"
            >
              <ChatBot />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
