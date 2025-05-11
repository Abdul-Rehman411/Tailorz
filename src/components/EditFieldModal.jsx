import React, { useState, useEffect, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import SimpleButton from "./SimpleButton";
import { EditIcon } from "../../public/icons/svgIcons";
import { LoadingSpinner } from "./LoadingSpinner";
import UserContext from "@/utils/UserContext";
import { motion, AnimatePresence } from "framer-motion";

function EditFieldModal({
  field,
  value,
  onSave,
  isLoading,
  setModalInfo,
  modalInfo,
}) {
  const [inputValue, setInputValue] = useState(value);
  const {
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const [isVisible, setIsVisible] = useState(modalInfo.isOpen);
  useEffect(() => {
    setIsVisible(modalInfo.isOpen);
  }, [modalInfo.isOpen]);

  const fieldLabels = {
    fullName: "Full Name",
    phone: "Phone Number",
    age: "Age",
    gender: "Gender",
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (field === "fullName") {
      if (!inputValue.trim()) {
        setShowMessage({
          type: "info",
          message: "Enter your full Name",
        });
        setPopUpMessageTrigger("true");
        return;
      } else if (inputValue.length < 3) {
        setShowMessage({
          type: "info",
          message: "Name must be at least 3 characters",
        });
        setPopUpMessageTrigger("true");
        return;
      }
    }
    if (field === "phone") {
      if (!/^\d*$/.test(inputValue)) {
        setShowMessage({
          type: "warning",
          message: "Phone number can only contain digits",
        });
        setPopUpMessageTrigger("true");
        return;
      }
      if (inputValue.length < 7 || inputValue.length > 10) {
        setShowMessage({
          type: "warning",
          message: "Please enter a valid phone number",
        });
        setPopUpMessageTrigger("true");
        return;
      }
      if (inputValue.startsWith("0")) {
        setShowMessage({
          type: "warning",
          message: "Please remove prefix (0) from phone number",
        });
        setPopUpMessageTrigger(true);
        return;
      }
    }

    // Call the onSave function if validation passes
    onSave(field, inputValue);
  };

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setModalInfo({ isOpen: false, field: "", value: "" });
    }, 300);
  }, [setIsVisible, setModalInfo]);

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
          className={`fixed inset-0 h-screen flex items-center justify-center md:translate-x-24`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className={`bg-black bg-opacity-50 fixed inset-0 rounded-lg`}
          ></div>
          <motion.div
            className={`rounded-lg shadow-lg w-11/12 max-w-md z-50`}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`${theme.mainTheme} rounded-lg p-6 w-full max-w-md relative`}
            >
              <h2
                className={`flex text-xl text-${theme.themeColor} font-bold mb-4`}
              >
                Change {fieldLabels[field]}
                <EditIcon
                  size={"6"}
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3"}
                />
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="relative mb-4">
                  {field === "gender" ? (
                    <select
                      name="gender"
                      value={inputValue}
                      onChange={handleChange}
                      className={`${inputStyles}`}
                    >
                      <option value="" className={`${theme.colorBg}`}>
                        Select Gender
                      </option>
                      <option value="Male" className={`${theme.colorBg}`}>
                        Male
                      </option>
                      <option value="Female" className={`${theme.colorBg}`}>
                        Female
                      </option>
                      <option value="Other" className={`${theme.colorBg}`}>
                        Other
                      </option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={inputValue}
                      onChange={handleChange}
                      className={`${inputStyles}`}
                      placeholder=" "
                    />
                  )}
                  <label className={`${placeHolderStyles}`}>
                    {fieldLabels[field]}
                  </label>
                </div>
                <div className="flex justify-center space-x-2 rtl:space-x-reverse">
                  <SimpleButton
                    btnText={"Cancel"}
                    type={"cancel"}
                    onClick={handleClose}
                  />
                  <SimpleButton
                    btnText={
                      isLoading ? <LoadingSpinner size={24} /> : "Save Changes"
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

export default EditFieldModal;
