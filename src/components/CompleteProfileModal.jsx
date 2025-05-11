import React, { useState, useContext, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { db } from "@/utils/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import UserContext from "@/utils/UserContext";
import SimpleButton from "./SimpleButton";
import { LoadingSpinner } from "./LoadingSpinner";

export default function CompleteProfileModal({ isVisible, userData, onClose }) {
  const {
    theme,
    setUserData,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
    userLoggedIn,
    loadingUserData,
  } = useContext(UserContext);

  const [formData, setFormData] = useState({
    age: userData?.age || "",
    countryCode: "+92",
    phone: userData?.phone || "",
    gender: userData?.gender || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = useCallback(async () => {
    // Validate Age
    const ageValue = formData.age.trim();
    if (!ageValue || isNaN(ageValue) || +ageValue < 7 || +ageValue > 100) {
      setShowMessage({
        type: "info",
        message: "Enter a valid age between 7 and 100 with no spaces",
      });
      setPopUpMessageTrigger("true");
      return;
    }

    // Validate Gender
    if (!formData.gender || formData.gender === "") {
      setShowMessage({
        type: "info",
        message: "Please select a gender",
      });
      setPopUpMessageTrigger("true");
      return;
    }

    // Validate Phone
    if (!formData.phone.trim()) {
      setShowMessage({
        type: "warning",
        message: "Please enter your phone number",
      });
      setPopUpMessageTrigger("true");
      return;
    }
    if (!/^\d*$/.test(formData.phone)) {
      setShowMessage({
        type: "warning",
        message: "Phone number can only contain digits",
      });
      setPopUpMessageTrigger("true");
      return;
    }
    if (
      (formData.phone && formData.phone.length < 7) ||
      formData.phone.length > 10
    ) {
      setShowMessage({
        type: "warning",
        message: "Please enter a valid phone number",
      });
      setPopUpMessageTrigger("true");
      return;
    }
    if (formData.phone.startsWith("0")) {
      setShowMessage({
        type: "warning",
        message: "Please remove prefix (0) from phone number",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    setIsLoading(true);
    try {
      // Query Firestore for the user document
      const userQuery = query(
        collection(db, "users"),
        where("uid", "==", userData?.uid)
      );
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        throw new Error("No document found for the given UID.");
      }

      const docId = querySnapshot.docs[0].id;
      const userDocRef = doc(db, "users", docId);

      // Prepare updated values
      // after you’ve got userDocRef…
      const updates = {
        age: formData.age,
        countryCode: formData.countryCode,
        phone: formData.phone,
        gender: formData.gender,
      };

      // this will only overwrite those four fields
      await updateDoc(userDocRef, updates);

      // then sync your local state/storage
      setUserData((prev) => ({ ...prev, ...updates }));
      sessionStorage.setItem(
        "userData",
        JSON.stringify({ ...userData, ...updates })
      );
      localStorage.setItem(
        "userData",
        JSON.stringify({ ...userData, ...updates })
      );

      setShowMessage({
        type: "success",
        message: "Profile updated successfully",
      });
      setPopUpMessageTrigger("true");

      onClose();
    } catch (error) {
      setShowMessage({ type: "error", message: error.message });
      setPopUpMessageTrigger("true");
    } finally {
      setIsLoading(false);
    }
  }, [
    formData,
    userData,
    setShowMessage,
    setPopUpMessageTrigger,
    setUserData,
    onClose,
  ]);

  if (!userData || !userLoggedIn || loadingUserData) return null;
  const { age, phone, gender } = userData;
  const isComplete = age && phone && gender;
  if (isComplete) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex h-screen items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-black bg-opacity-50 fixed inset-0"></div>

          <div className="w-[90%] max-w-[90%] md:w-[50%] fixed flex items-center justify-center md:translate-x-24 z-50">
            <motion.div
              className={`rounded-xl shadow-lg w-[90%] lg:w-[75%] z-50 ${theme.mainTheme}`}
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`p-4 flex items-center rounded-t-xl`}>
                <span className="ml-3 text-white font-medium">
                  Complete Your Profile
                </span>
              </div>

              <div className={`p-8 h-auto w-full ${theme.colorText}`}>
                {/* Age Field */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={`${inputStyles}`}
                    placeholder=" "
                  />
                  <label className={`${placeHolderStyles}`} htmlFor="age">
                    Age
                  </label>
                </div>

                {/* Phone Field */}
                <div className="relative mb-4 flex">
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className={`border-b-2 bg-transparent p-2 ${theme.colorText} ${theme.colorBorder} focus:border-blue-600 outline-none`}
                  >
                    <option value="+92">🇵🇰 +92</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                  </select>

                  <div className="relative flex-1 ml-3">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${inputStyles}`}
                      placeholder=" "
                    />
                    <label className={`${placeHolderStyles}`} htmlFor="phone">
                      Phone Number
                    </label>
                  </div>
                </div>

                {/* Gender Field */}
                <div className="relative mb-4">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`border-b-2 bg-transparent p-2 w-full ${theme.colorText} ${theme.colorBorder} focus:border-blue-600 outline-none`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <SimpleButton
                  btnText={isLoading ? <LoadingSpinner size={24} /> : "Save"}
                  type={"primary-submit"}
                  extraclasses={"w-full"}
                  onClick={handleSave}
                  disabled={isLoading}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
