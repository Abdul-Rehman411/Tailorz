"use client";
import React, { useState, useContext } from "react";
import SimpleButton from "./SimpleButton";
import DialogBox from "./DialogBox";
import sendNotification from "@/utils/sendNotification";
import { AnimatePresence } from "framer-motion";
import UserContext from "@/utils/UserContext";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import { LoadingSpinner } from "./LoadingSpinner";
import { FaShareAlt } from "react-icons/fa";

const ShareLinkDialog = ({ sender, shareLink, subject }) => {
  const {
    theme,
    inputStyles,
    setShowMessage,
    setPopUpMessageTrigger,
    placeHolderStyles,
  } = useContext(UserContext);
  const [showDialog, setShowDialog] = useState(false);
  const [shareType, setShareType] = useState("tailor"); // or 'user'

  // New separate states for country code and phone number
  const [countryCode, setCountryCode] = useState("+92");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [allowEdit, setAllowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    // Basic validation: ensure phone number is provided
    const cleanedPhone = phoneNumber.trim().replace(/\D/g, "");
    if (!cleanedPhone) {
      setShowMessage({
        message: "Please enter a valid phone number",
        type: "warning",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    setIsLoading(true);
    try {
      const collectionName = shareType === "tailor" ? "tailors" : "users";
      const phoneField = shareType === "tailor" ? "businessPhone" : "phone";
      const notifType = shareType === "tailor" ? "business" : "user";

      const snapshot = await getDocs(collection(db, collectionName));
      const matches = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (item) =>
            item["countryCode"] === countryCode &&
            item[phoneField] === cleanedPhone
        );

      if (matches.length === 0) {
        setShowMessage({
          message: `No ${shareType} found with this phone number. Make sure you don't use prefix (0)`,
          type: "warning",
        });
        setPopUpMessageTrigger(true);
        return;
      }

      const target = matches[0];
      // send notification
      const recipientId = shareType === "tailor" ? target.ownerId : target.uid;
      await sendNotification(
        recipientId,
        notifType,
        `${sender.fullName} shared ${
          subject === "Product" ? "a" : "their"
        } ${subject} with you!`,
        shareLink
      );

      // only for tailor: save connection
      if (shareType === "tailor" && allowEdit) {
        const relId = `${target.id}_${sender.uid}`;
        await setDoc(doc(db, "userTailorConnections", relId), {
          tailorId: target.id,
          userId: sender.uid,
          timestamp: new Date(),
        });
      }

      setShowMessage({
        message: `${subject} shared successfully!`,
        type: "success",
      });
      setPopUpMessageTrigger(true);
      setShowDialog(false);
    } catch (err) {
      console.error(err);
      setShowMessage({
        message: "Something went wrong. Please try again.",
        type: "error",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setShowMessage({ message: "Link copied to clipboard!", type: "success" });
      setPopUpMessageTrigger(true);
      setShowDialog(false);
    });
  };

  const placeholder =
    shareType === "tailor" ? "Tailor Phone Number" : "User Phone Number";
  const promptText =
    shareType === "tailor"
      ? "Select business country code and enter phone number:"
      : "Select user country code and enter phone number:";

  return (
    <>
      <SimpleButton
        btnText={`Share ${subject}`}
        icon={<FaShareAlt />}
        onClick={() => setShowDialog(true)}
      />

      <AnimatePresence>
        {showDialog && (
          <DialogBox
            title={`Share ${subject}`}
            type="info"
            showDialog={showDialog}
            setShowDialog={setShowDialog}
            body={() => (
              <div className="select-none">
                <div className="mb-4 flex justify-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="tailor"
                      checked={shareType === "tailor"}
                      onChange={() => setShareType("tailor")}
                      className="form-radio"
                    />
                    <span className="ml-2">Tailor</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="user"
                      checked={shareType === "user"}
                      onChange={() => setShareType("user")}
                      className="form-radio"
                    />
                    <span className="ml-2">User</span>
                  </label>
                </div>

                <h2 className="mb-2">{promptText}</h2>
                <div className="relative mb-4">
                  <div className="flex">
                    <select
                      id="countryCode"
                      name="countryCode"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className={`border-b-2 bg-transparent p-2 ${theme.colorText} ${theme.colorBorder} focus:border-blue-600 outline-none`}
                    >
                      <option value="+92" className={theme.colorBg}>
                        🇵🇰 +92
                      </option>
                      <option className={theme.colorBg} value="+1">
                        🇺🇸 +1
                      </option>
                      <option className={theme.colorBg} value="+44">
                        🇬🇧 +44
                      </option>
                      <option className={theme.colorBg} value="+61">
                        🇦🇺 +61
                      </option>
                      {/* Add more countries if you want */}
                    </select>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`ml-3 ${inputStyles}`}
                      placeholder=" "
                    />
                    <label
                      className={`ml-24 ${placeHolderStyles}`}
                      htmlFor="phone"
                    >
                      {placeholder}
                    </label>
                  </div>
                </div>

                {shareType === "tailor" && subject === "Profile" && (
                  <>
                    <label className="flex items-center mt-2 space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowEdit}
                        onChange={(e) => setAllowEdit(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">
                        Allow Measurements Editing
                      </span>
                    </label>
                    <span className="text-xs">
                      This will also add the tailor to My Tailors
                    </span>
                  </>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <SimpleButton
                    btnText="Copy Link"
                    icon={<i className="fas fa-link mr-2" />}
                    type="default"
                    onClick={copyLink}
                    extraClasses="flex items-center px-4 py-2 rounded-lg border"
                  />

                  <SimpleButton
                    btnText="Share Now"
                    icon={
                      isLoading ? (
                        <LoadingSpinner size={20} extraClasses="mr-2" />
                      ) : (
                        <i className="fas fa-share mr-2" />
                      )
                    }
                    type="primary"
                    onClick={handleShare}
                    extraClasses="flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white"
                  />
                </div>
              </div>
            )}
            buttons={[]}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareLinkDialog;
