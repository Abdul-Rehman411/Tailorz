import React, { useState, useEffect, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import SimpleButton from "./SimpleButton";
import { LoadingSpinner } from "./LoadingSpinner";
import { EditIcon } from "../../public/icons/svgIcons";
import UserContext from "@/utils/UserContext";
import { motion, AnimatePresence } from "framer-motion";

function ChangePasswordModal({
  onSave,
  isLoading,
  isPasswordModalOpen,
  setIsPasswordModalOpen,
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const {
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const [isVisible, setIsVisible] = useState(isPasswordModalOpen);
  useEffect(() => {
    setIsVisible(isPasswordModalOpen);
  }, [isPasswordModalOpen]);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "newPassword") {
      setNewPassword(value);
    }
    if (name === "confirmPassword") {
      setConfirmPassword(value);
    }
    if (name === "currentPassword") {
      setCurrentPassword(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let errorMessage = "";

    if (newPassword !== confirmPassword) {
      errorMessage = "New passwords donot match";
    } else if (newPassword === currentPassword) {
      errorMessage = "New password cannot be the same as the old password";
    } else if (newPassword.length < 6) {
      errorMessage = "Password must be at least 6 characters";
    }

    if (errorMessage) {
      setShowMessage({
        type: "info",
        message: errorMessage,
      });
      setPopUpMessageTrigger("true");
      return;
    }
    onSave(formData);
  };

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setIsPasswordModalOpen(false);
    }, 300);
  }, [setIsVisible, setIsPasswordModalOpen]);

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
          className={`fixed inset-0 flex h-screen items-center justify-center md:translate-x-24`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className={`bg-black bg-opacity-50 fixed inset-0 rounded-lg`}
          ></div>
          <motion.div
            className={`rounded-lg shadow-lg w-11/12 max-w-md z-50`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`${theme.mainTheme} p-6 rounded-lg w-full max-w-md relative`}
            >
              <h2
                className={`flex text-xl text-${theme.themeColor} font-bold mb-4`}
              >
                Change Password
                <EditIcon
                  size={"6"}
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3"}
                />
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`${inputStyles}`}
                    placeholder=" "
                    required
                  />
                  <label className={`${placeHolderStyles}`}>
                    Current Password
                  </label>
                </div>
                <div className="relative mb-4">
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`${inputStyles}`}
                    placeholder=" "
                    required
                  />
                  <label className={`${placeHolderStyles}`}>New Password</label>
                </div>
                <div className="relative mb-4">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`${inputStyles}`}
                    placeholder=" "
                    required
                  />
                  <label className={`${placeHolderStyles}`}>
                    Confirm Password
                  </label>
                </div>
                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <SimpleButton
                    btnText={"Cancel"}
                    onClick={handleClose}
                    type={"cancel"}
                  />
                  <SimpleButton
                    btnText={
                      isLoading ? (
                        <LoadingSpinner size={24} />
                      ) : (
                        "Change Password"
                      )
                    }
                    type={"primary-submit"}
                    extraclasses={"w-full"}
                    disabled={isLoading}
                  />
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body // This ensures the modal is rendered at the top level
  );
}

export default ChangePasswordModal;
