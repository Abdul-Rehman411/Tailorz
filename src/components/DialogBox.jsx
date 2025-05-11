"use client";

import React, { useState, useEffect, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import UserContext from "@/utils/UserContext";
import SimpleButton from "./SimpleButton";

const DialogBox = ({
  body,
  title,
  type = "info",
  buttons = [],
  showDialog,
  setShowDialog,
}) => {
  const [isVisible, setIsVisible] = useState(showDialog);
  const { theme } = useContext(UserContext);
  useEffect(() => {
    setIsVisible(showDialog);
  }, [showDialog]);

  let iconPath, bgColor;
  switch (type) {
    case "success":
      iconPath =
        "M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z";
      bgColor = "bg-green-600";
      break;
    case "danger":
      iconPath =
        "M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z";
      bgColor = "bg-red-600";
      break;
    case "warning":
      iconPath =
        "M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z";
      bgColor = "bg-yellow-600";
      break;
    case "info":
    default:
      iconPath =
        "M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z";
      bgColor = "bg-blue-500";
      break;
  }

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="fill-current text-white"
      viewBox="0 0 16 16"
      width="20"
      height="20"
    >
      <path fillRule="evenodd" d={iconPath}></path>
    </svg>
  );

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setShowDialog(false);
    }, 300);
  }, [setIsVisible, setShowDialog]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose(); // Trigger the Cancel button on Esc key press
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex h-screen items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-black bg-opacity-50 fixed inset-0"></div>
          <div className="w-full max-w-[75%] md:max-w-[50%] lg:max-w-[40%] xl:max-w-[30%] fixed lex items-center justify-center md:translate-x-24">
            <motion.div
              className={`rounded-xl shadow-lg w-auto z-50 ${theme.mainTheme}`}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`${bgColor} p-4 flex items-center rounded-t-xl`}>
                {icon}
                <span className="ml-3 text-white font-medium">{title}</span>
              </div>
              <div className={`p-8 h-auto w-full ${theme.colorText}`}>
                {typeof body === "function" ? body() : body}
              </div>
              <div className={`p-4 flex justify-end space-x-3`}>
                <SimpleButton
                  onClick={handleClose}
                  type={"default"}
                  btnText={"Close"}
                />
                {buttons.map(({ label, onClick, type }, index) => (
                  <SimpleButton
                    key={index}
                    onClick={onClick}
                    btnText={label}
                    type={type}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body // This ensures the modal is rendered at the top level
  );
};

export default DialogBox;
