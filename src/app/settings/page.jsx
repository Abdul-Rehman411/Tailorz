"use client";
import { auth, db } from "@/utils/firebaseConfig";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import React, { useContext, useState, useEffect } from "react";
import EditFieldModal from "@/components/EditFieldModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import OptionSelector from "@/components/OptionSelector";
import UserContext from "@/utils/UserContext";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  AdjustmentsIcon,
  EditIcon,
  SettingsIcon,
  UserIcon,
} from "../../../public/icons/svgIcons";
import SimpleButton from "@/components/SimpleButton";
import DialogBox from "@/components/DialogBox";
import Footer from "@/components/Footer";
import { ClipLoader } from "react-spinners";

function AccountSettings() {
  const {
    userData,
    theme,
    userLoggedIn,
    setUserData,
    handleSetTheme,
    setShowMessage,
    setPopUpMessageTrigger,
    loadingUserData,
  } = useContext(UserContext);

  const router = useRouter();
  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    field: "",
    value: "",
  });
  const [DialogBoxInfo, setDialogBoxInfo] = useState({
    title: "",
    message: "",
    type: "",
    buttons: [],
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const fieldLabels = {
    fullName: "Full Name",
    phone: "Phone Number",
    age: "Age",
    gender: "Gender",
  };

  const handleFieldClick = (field) => {
    if (field === "password") {
      setIsPasswordModalOpen(true);
    } else {
      setModalInfo({
        isOpen: true,
        field: field,
        value: typeof userData[field] !== "object" ? userData[field] : "",
      });
    }
  };

  const handleFieldSave = async (field, newValue) => {
    try {
      setIsLoading(true);
      // Check if the new value is different
      if (
        (field === "fullName" && newValue === userData?.fullName) ||
        (field === "phone" && newValue === userData?.phone) ||
        (field === "age" && newValue === userData?.age)
      ) {
        setModalInfo({ isOpen: false, field: "", value: "" });
        return;
      }
      if (field === "phone") {
        if (!/^\d*$/.test(newValue)) {
          setShowMessage({
            type: "warning",
            message: "Phone number can only contain digits",
          });
          setPopUpMessageTrigger("true");
          return;
        }
        if (newValue.length < 7 || newValue.length > 10) {
          setShowMessage({
            type: "warning",
            message: "Please enter a valid phone number",
          });
          setPopUpMessageTrigger("true");
          return;
        }
      }

      if (field === "age") {
        const ageValue = newValue;
        if (!ageValue || isNaN(ageValue) || +ageValue < 10 || +ageValue > 100) {
          setShowMessage({
            type: "info",
            message: "Enter a valid age between 10 and 100 with no spaces",
          });
          setPopUpMessageTrigger("true");
          return;
        }
      }

      // Query Firestore to find the document with the matching UID
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

      // Update the document
      await updateDoc(userDocRef, {
        [field]: newValue,
      });

      // Update only the changed field in userData
      setUserData((prevUserData) => ({
        ...prevUserData,
        [field]: newValue,
      }));

      userData[field] = newValue;

      // Save the updated userData back to sessionStorage
      sessionStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("userData", JSON.stringify(userData));

      setUserData({ ...userData, [field]: newValue });
      setModalInfo({ isOpen: false, field: "", value: "" });

      setShowMessage({
        type: "success",
        message: `${fieldLabels[field]} ` + "updated successfully!",
      });
      setPopUpMessageTrigger("true");
    } catch (error) {
      setShowMessage({
        type: "danger",
        message:
          "Failed to update " + ` ${fieldLabels[field]}. ${error.message}`,
      });
      setPopUpMessageTrigger("true");
    } finally {
      setIsLoading(false);
    }
  };

  const hadleChangePassword = async (data) => {
    try {
      setIsLoading(true);
      const user = auth.currentUser;

      // Re-authenticate the user with the current password
      const credential = EmailAuthProvider.credential(
        userData.email,
        data.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update the user's password
      await updatePassword(user, data.newPassword);
      setShowMessage({
        type: "success",
        message: "Password saved!",
      });
      setPopUpMessageTrigger("true");

      setIsPasswordModalOpen(false); // Close the modal
    } catch (error) {
      let errorMessage = "An error Occured: " + ` ${error.message}`;
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid current password";
      } else if (error.code === "auth/missing-password") {
        errorMessage = "Enter a password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later!";
      }
      setShowMessage({ type: "danger", message: errorMessage });
      setPopUpMessageTrigger("true");
    } finally {
      setIsLoading(false);
    }
  };

  const themeOptions = [
    { value: "systemDefault", label: "System Default" },
    { value: "midnightWhisper", label: "Midnight Whisper" },
    { value: "lunarGlow", label: "Lunar Glow" },
    { value: "neonPunk", label: "Neon Punk" },
  ];

  const handleThemeChange = (e) => {
    const themeName = e.target.value;
    handleSetTheme(themeName);
  };

  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);
      localStorage.setItem("TailorEaseTheme", JSON.stringify(theme.themeName));
      setShowMessage({
        type: "success",
        message: "Prefererences saved!",
      });
      setPopUpMessageTrigger(true);
    } catch (error) {
      setShowMessage({
        type: "danger",
        message: "Something went wrong: " + error.message,
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscardChanges = () => {
    router.push("/user");
  };

  useEffect(() => {
    if (!userLoggedIn) {
      router.push("/login");
    }
  }, [userLoggedIn, router]);

  if (isLoading || loadingUserData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader color="white" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div
        className={`max-w-[99.5%] mx-auto mt-4 mb-14 md:my-1 w-auto p-6 rounded-t-lg select-none ${theme.mainTheme}`}
      >
        <h2
          className={`flex text-2xl font-bold mb-6 pt-6 border-b ${theme.colorBorder}`}
        >
          Account Settings
          <SettingsIcon
            color={`${theme.iconColor}`}
            extraClasses={"ml-3 rtl:mr-3 mt-1"}
          />
        </h2>
        {/* Parent Settings div */}
        <div
          className={`lg:flex lg:space-x-5 xl:space-x-14 pb-6 border-b ${theme.colorBorder}`}
        >
          {/* Personal Info Section */}
          <div className="space-y-4 w-full lg:w-1/2">
            <h2 className="flex text-xl font-semibold  mb-6">
              Personal Information
              <UserIcon
                color={`${theme.iconColor}`}
                extraClasses={"ml-3 mt-1"}
              />
            </h2>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <span>Full Name</span>
              <span
                className={`flex  cursor-pointer ${theme.hoverText}`}
                onClick={() => handleFieldClick("fullName")}
              >
                {userData?.fullName}
                <EditIcon
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3 mt-1"}
                />
              </span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <span>Email</span>
              <span
                className={`flex  cursor-pointer ${theme.hoverText}`}
                onClick={() => {
                  setShowDialog(true);
                  setDialogBoxInfo({
                    title: "Information!",
                    message: "Email address cannot be changed!",
                    type: "info",
                  });
                }}
              >
                {userData?.email}
              </span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <span>Gender</span>
              <span
                className={`flex  cursor-pointer ${theme.hoverText}`}
                onClick={() => handleFieldClick("gender")}
              >
                {userData?.gender ? (
                  userData?.gender
                ) : (
                  <span
                    className={`italic ${theme.colorText} ${theme.hoverText}`}
                  >
                    <sub>click to select your gender</sub>
                  </span>
                )}
                <EditIcon
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3 mt-1"}
                />
              </span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <span>Age</span>
              <span
                className={`flex  cursor-pointer ${theme.hoverText}`}
                onClick={() => handleFieldClick("age")}
              >
                {userData?.age ? (
                  userData?.age
                ) : (
                  <span
                    className={`italic ${theme.colorText} ${theme.hoverText}`}
                  >
                    <sub>click to enter your age</sub>
                  </span>
                )}
                <EditIcon
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3 mt-1"}
                />
              </span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <span>Phone Number</span>
              <span
                className={`flex  cursor-pointer ${theme.hoverText}`}
                onClick={() => handleFieldClick("phone")}
              >
                {userData?.phone !== "" ? (
                  userData.countryCode + "-" + userData.phone
                ) : (
                  <span
                    className={`italic ${theme.colorText} ${theme.hoverText}`}
                  >
                    <sub>click to add phone number</sub>
                  </span>
                )}
                <EditIcon
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3 mt-1"}
                />
              </span>
            </div>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <span>Password</span>
              <span
                className={`flex cursor-pointer ${theme.hoverText}`}
                onClick={() => handleFieldClick("password")}
              >
                ●●●●●●●●
                <EditIcon
                  color={`${theme.iconColor}`}
                  extraClasses={"ml-3 mt-1"}
                />
              </span>
            </div>
          </div>
          {/* divider line */}
          <div className={`w-0 border-r ${theme.colorBorder}`}></div>{" "}
          {/* Preferrences section */}
          <div className="space-y-4 w-full lg:w-1/2 mt-8 lg:mt-0">
            <h2 className={`flex text-xl font-semibold  mb-6`}>
              Preferrences
              <AdjustmentsIcon
                color={`${theme.iconColor}`}
                extraClasses={"ml-3 mt-1"}
              />
            </h2>
            <div
              className={`flex justify-between items-center p-3 rounded-md ${theme.colorBg}`}
            >
              <label htmlFor="select-options">Theme</label>
              <OptionSelector
                options={themeOptions}
                value={theme.themeName}
                onChange={handleThemeChange}
                theme={theme}
                classes={"w-40"}
              />
            </div>
            <div className="flex">
              <div className="flex items-center mx-auto justify-center mt-8 sm:space-x-3 space-x-1">
                <SimpleButton
                  onClick={() => {
                    setShowDialog(true);
                    setDialogBoxInfo({
                      title: "Warning!",
                      message: "Are you sure you want to discard all changes?",
                      type: "warning",
                      buttons: [
                        {
                          label: "Yes, Discard",
                          onClick: handleDiscardChanges,
                          type: "danger",
                        },
                      ],
                    });
                  }}
                  btnText={"Discard"}
                  type={"danger"}
                  extraclasses={"w-auto"}
                />
                <SimpleButton
                  onClick={handleSavePreferences}
                  btnText={"Save Prefererences"}
                  type={"primary"}
                  extraclasses={"w-auto px-6"}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        {modalInfo.isOpen && (
          <EditFieldModal
            modalInfo={modalInfo}
            setModalInfo={setModalInfo}
            field={modalInfo.field}
            value={modalInfo.value}
            onSave={handleFieldSave}
            isLoading={isLoading}
          />
        )}

        {isPasswordModalOpen && (
          <ChangePasswordModal
            setIsPasswordModalOpen={setIsPasswordModalOpen}
            onSave={hadleChangePassword}
            isLoading={isLoading}
            isPasswordModalOpen={isPasswordModalOpen}
          />
        )}
        {showDialog && (
          <DialogBox
            title={DialogBoxInfo.title}
            body={DialogBoxInfo.message}
            type={DialogBoxInfo.type}
            showDialog={showDialog}
            setShowDialog={setShowDialog}
            buttons={DialogBoxInfo.buttons}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default AccountSettings;
