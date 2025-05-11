"use client";
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import Image from "next/image";
import { db } from "@/utils/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SimpleButton from "@/components/SimpleButton";
import UserContext from "@/utils/UserContext";
import DialogBox from "@/components/DialogBox";
import ImageCropper from "@/components/ImageCropper";

const FIXED_SPECIALTIES = [
  "Men Specialist",
  "Women Specialist",
  "Kids Specialist",
  "Alterations",
  "Custom Tailoring",
  "Other",
];

const TailorBusinessProfile = () => {
  const [tailorData, setTailorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const {
    theme,
    userLoggedIn,
    userData,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogBoxInfo, setDialogBoxInfo] = useState({
    title: "",
    body: "",
    type: "",
    buttons: [],
  });

  const [formData, setFormData] = useState({
    businessName: "",
    businessPictureUrl: "",
    description: "",
    experience: "",
    openTime: "09:00",
    closeTime: "18:00",
    businessAddress: "",
    specialities: [],
  });

  const handleImageCropped = useCallback((croppedImageUrl) => {
    setPreviewImage(croppedImageUrl);
    setCropperModalOpen(false);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setCropperModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchTailorData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!userLoggedIn || !userData?.uid) {
          setError("User not authenticated");
          return;
        }

        // Step 1: Get user document to find bid
        const q = query(
          collection(db, "users"),
          where("uid", "==", userData.uid)
        );
        const querySnapshot = await getDocs(q);

        // Step 2: Check if the document exists
        if (querySnapshot.empty) {
          setError("User document not found");
          return;
        }

        // Step 3: Get the document snapshot (first match)
        const userDocSnap = querySnapshot.docs[0];

        const userDataFromDB = userDocSnap.data();
        const bid = userDataFromDB.bId;

        if (!bid) {
          setError("Business ID not found in user document");
          return;
        }

        // Step 2: Get tailor document using bid
        const tailorDocRef = doc(db, "tailors", bid);
        const tailorDocSnap = await getDoc(tailorDocRef);

        if (!tailorDocSnap.exists()) {
          setError("Tailor document not found with the provided BID");
          return;
        }

        const data = tailorDocSnap.data();
        setTailorData(data);
        setFormData({
          businessName: data.businessName || "",
          businessPictureUrl: data.businessPictureUrl || "",
          description: data.description || "",
          experience: data.experience || "",
          openTime: data.openTime || "09:00",
          closeTime: data.closeTime || "18:00",
          businessAddress: data.businessAddress || "",
          specialities: data.specialities || [],
        });
        setPreviewImage(data.businessPictureUrl || null);
      } catch (error) {
        console.error("Error fetching tailor data:", error);
        setError(`Failed to load profile: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTailorData();
  }, [userLoggedIn, userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleSpeciality = (speciality) => {
    setFormData((prev) => {
      const isSelected = prev.specialities.includes(speciality);
      return {
        ...prev,
        specialities: isSelected
          ? prev.specialities.filter((item) => item !== speciality)
          : [...prev.specialities, speciality],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Get bid from user document again to ensure we have the latest
      const q = query(
        collection(db, "users"),
        where("uid", "==", userData.uid)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User document not found");
        return;
      }

      const userDocSnap = querySnapshot.docs[0];
      const bid = userDocSnap.data().bId;
      if (!bid) {
        throw new Error("Business ID (bid) not found");
      }

      let imageUrl = formData.businessPictureUrl;
      if (selectedFile && previewImage) {
        setIsUploading(true);
        try {
          // Convert cropped image to blob
          const response = await fetch(previewImage);
          const blob = await response.blob();
          const base64Image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.readAsDataURL(blob);
          });

          const fileName = `profile-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}.jpg`;
          const targetPath = "images/profile/business";

          const uploadResponse = await fetch("/api/imageUpload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageData: base64Image,
              fileName,
              targetPath,
            }),
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Image upload failed: ${errorText}`);
          }

          const { url } = await uploadResponse.json();
          imageUrl = "/" + url;
        } catch (error) {
          console.error("Error uploading image:", error);
          setShowMessage({
            message: "Image upload failed",
            type: "danger",
          });
          setPopUpMessageTrigger(true);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const updatedData = {
        businessName: formData.businessName,
        businessPictureUrl: imageUrl,
        description: formData.description,
        experience: formData.experience,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        businessAddress: formData.businessAddress,
        specialities: formData.specialities,
        lastUpdated: new Date().toISOString(),
      };

      await updateDoc(doc(db, "tailors", bid), updatedData);

      setTailorData(updatedData);
      setIsEditing(false);

      setShowMessage({
        type: "success",
        message: "Profile updated successfully!",
      });
      setPopUpMessageTrigger(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      setShowMessage({
        type: "danger",
        message: `Failed to update profile: ${error.message}`,
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      businessName: tailorData.businessName || "",
      businessPictureUrl: tailorData.businessPictureUrl || "",
      description: tailorData.description || "",
      experience: tailorData.experience || "",
      openTime: tailorData.openTime || "09:00",
      closeTime: tailorData.closeTime || "18:00",
      businessAddress: tailorData.businessAddress || "",
      specialities: tailorData.specialities || [],
    });
    setPreviewImage(tailorData.businessPictureUrl || null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-lg"
          >
            Loading your profile...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-6 max-w-md"
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-5xl mb-4 ${theme.iconColor}`}
          >
            <i className="fas fa-exclamation-triangle"></i>
          </motion.div>
          <h1 className="text-2xl font-bold mb-4">Profile Loading Failed</h1>
          <p className="mb-6">{error}</p>
          <SimpleButton
            btnText="Try Again"
            type="primary"
            onClick={() => window.location.reload()}
          />
        </motion.div>
      </div>
    );
  }

  if (!tailorData) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className={`text-5xl mb-4 ${theme.iconColor}`}>
            <i className="fas fa-user-secret"></i>
          </div>
          <h1 className="text-2xl font-bold mb-4">No Business Profile Found</h1>
          <p className="mb-6">
            Please contact support if you believe this is an error
          </p>
        </motion.div>
      </div>
    );
  }

  if (tailorData.status === "suspended") {
    return (
      <div
        className={`flex items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className={`text-5xl mb-4 ${theme.iconColor}`}>
            <i className="fas fa-user-secret"></i>
          </div>
          <h1 className="text-2xl font-bold mb-4">
            Your business account has been suspended.
          </h1>
          <p className="mb-6">
            Please contact support if you believe this is an error
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-y-auto ${theme.mainTheme} py-8 px-4 sm:px-6 lg:px-8`}
    >
      {/* Image Cropper Modal */}
      <ImageCropper
        aspectRatio={3 / 2}
        onCropComplete={handleImageCropped}
        showModal={cropperModalOpen}
        setShowModal={setCropperModalOpen}
        imageSrc={imageToCrop}
        modalTitle="Profile Image Cropper"
        instructionText="Adjust your profile image to fit within the 3:2 ratio crop area. This will be used as your business profile picture."
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header with Edit Button */}
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            className="text-3xl md:text-4xl font-bold"
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isEditing ? "Edit Business Profile" : "Business Profile"}
          </motion.h1>

          {!isEditing && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <SimpleButton
                btnText={
                  <>
                    <i className="fas fa-edit mr-2"></i> Edit Profile
                  </>
                }
                type="primary"
                onClick={() => setIsEditing(true)}
              />
            </motion.div>
          )}
        </div>

        {/* Profile Card */}
        <motion.div
          className={`rounded-lg overflow-hidden ${theme.mainTheme}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8">
                {/* Business Image */}
                <motion.div
                  className="flex flex-col items-center mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="relative group">
                    <motion.div
                      className="w-60 h-40 md:w-72 md:h-48 rounded-lg overflow-hidden border-4 border-white shadow-lg relative"
                      whileHover={{ scale: 1.03 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                    >
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt="Business Preview"
                          width={300}
                          height={200}
                          style={{ objectFit: "cover" }}
                          className="transition-all duration-300 group-hover:opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <i className="fas fa-camera text-4xl text-gray-500"></i>
                        </div>
                      )}
                    </motion.div>
                    <motion.label
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-2 right-2 bg-blue-500 text-white w-8 h-8 rounded-full cursor-pointer shadow-md"
                      htmlFor="businessImage"
                    >
                      <i className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fas fa-camera"></i>
                      <input
                        id="businessImage"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/jpeg,image/png,image/svg+xml"
                        className="hidden"
                      />
                    </motion.label>
                    {isUploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
                      >
                        <ClipLoader size={30} color="#ffffff" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Business Name */}
                <motion.div
                  className="mb-6 relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={`${inputStyles} text-2xl font-bold`}
                    required
                  />
                  <label className={`${placeHolderStyles} text-xl`}>
                    Business Name
                  </label>
                </motion.div>

                {/* Description */}
                <motion.div
                  className="mb-6 relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`${inputStyles} min-h-[100px]`}
                    rows={4}
                  />
                  <label className={`${placeHolderStyles}`}>
                    Business Description
                  </label>
                </motion.div>

                {/* Experience and Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className={`${inputStyles}`}
                      min="0"
                      max="100"
                    />
                    <label className={`${placeHolderStyles}`}>
                      Years of Experience
                    </label>
                  </motion.div>

                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <input
                      type="text"
                      name="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleInputChange}
                      className={`${inputStyles}`}
                    />
                    <label className={`${placeHolderStyles}`}>
                      Business Address
                    </label>
                  </motion.div>
                </div>

                {/* Working Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <label className={`block mb-2 ${theme.colorText}`}>
                      Opening Time
                    </label>
                    <input
                      type="time"
                      name="openTime"
                      value={formData.openTime}
                      onChange={handleInputChange}
                      className={`${inputStyles} p-2`}
                      required
                    />
                  </motion.div>

                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <label className={`block mb-2 ${theme.colorText}`}>
                      Closing Time
                    </label>
                    <input
                      type="time"
                      name="closeTime"
                      value={formData.closeTime}
                      onChange={handleInputChange}
                      className={`${inputStyles} p-2`}
                      required
                    />
                  </motion.div>
                </div>

                {/* Specialities */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                >
                  <label
                    className={`block mb-4 ${theme.colorText} text-lg font-medium`}
                  >
                    Specialities
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {FIXED_SPECIALTIES.map((speciality) => {
                      const isSelected =
                        formData.specialities.includes(speciality);
                      return (
                        <motion.button
                          key={speciality}
                          type="button"
                          onClick={() => toggleSpeciality(speciality)}
                          className={`flex items-center px-4 py-2 rounded-full border transition-all duration-300 ${
                            isSelected
                              ? `${theme.colorPrimaryBg} ${theme.colorPrimaryText} border-transparent`
                              : `${theme.colorBorder} ${theme.colorText}`
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="mr-2">{speciality}</span>
                          {isSelected ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-green-500"
                            >
                              <i className="fas fa-check"></i>
                            </motion.span>
                          ) : (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-gray-400"
                            >
                              <i className="fas fa-plus"></i>
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Selected Specialities */}
                  {formData.specialities.length > 0 && (
                    <motion.div
                      className="mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <h4 className="text-md font-medium mb-2">
                        Your Selected Specialities:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialities.map((speciality, index) => (
                          <motion.div
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className={`flex items-center px-3 py-1 rounded-full ${theme.mainTheme} ${theme.colorBorder} border`}
                          >
                            <span>{speciality}</span>
                            <button
                              type="button"
                              onClick={() => toggleSpeciality(speciality)}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex justify-end gap-4 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SimpleButton
                      btnText="Cancel"
                      type="secondary"
                      onClick={handleCancel}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SimpleButton
                      btnText={
                        isLoading ? (
                          <LoadingSpinner size={24} />
                        ) : (
                          <>
                            <i className="fas fa-save mr-2"></i> Save Changes
                          </>
                        )
                      }
                      type="primary-submit"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </form>
          ) : (
            <div className="p-6 md:p-8">
              {/* Business Info */}
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    initial={{ rotate: 0, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-60 h-40 md:w-72 md:h-48 rounded-lg overflow-hidden border-4 border-white shadow-lg relative"
                  >
                    {tailorData.businessPictureUrl ? (
                      <Image
                        src={tailorData.businessPictureUrl}
                        alt={tailorData.businessName}
                        width={300}
                        height={200}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <i className="fas fa-camera text-4xl text-gray-500"></i>
                      </div>
                    )}
                  </motion.div>
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                    <i className="fas fa-eye text-white text-2xl"></i>
                  </div>
                </motion.div>

                <div className="flex-1">
                  <motion.h2
                    className="text-2xl md:text-3xl font-bold mb-4"
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {tailorData.businessName}
                  </motion.h2>

                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center">
                      <i
                        className={`fas fa-clock mr-3 ${theme.iconColor} text-lg`}
                      ></i>
                      <span>
                        Working Hours: {tailorData.openTime} -{" "}
                        {tailorData.closeTime}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <i
                        className={`fas fa-briefcase mr-3 ${theme.iconColor} text-lg`}
                      ></i>
                      <span>
                        Experience: {tailorData.experience || "Not specified"}{" "}
                        years
                      </span>
                    </div>

                    <div className="flex items-center">
                      <i
                        className={`fas fa-map-marker-alt mr-3 ${theme.iconColor} text-lg`}
                      ></i>
                      <span>
                        Address: {tailorData.businessAddress || "Not provided"}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Description */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <i
                    className={`fas fa-align-left mr-2 ${theme.iconColor}`}
                  ></i>
                  About
                </h3>
                <p className={`${theme.colorText} leading-relaxed`}>
                  {tailorData.description || "No description available"}
                </p>
              </motion.div>

              {/* Specialities */}
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <i className={`fas fa-star mr-2 ${theme.iconColor}`}></i>
                  Specialities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tailorData.specialities?.length > 0 ? (
                    tailorData.specialities.map((speciality, index) => (
                      <motion.span
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className={`px-4 py-2 rounded-full ${theme.mainTheme} ${theme.colorBorder} border shadow-sm flex items-center`}
                      >
                        <span>{speciality}</span>
                      </motion.span>
                    ))
                  ) : (
                    <span className="italic">No specialties listed</span>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>

        {showDialog && (
          <DialogBox
            body={dialogBoxInfo.body}
            title={dialogBoxInfo.title}
            type={dialogBoxInfo.type}
            buttons={dialogBoxInfo.buttons}
            showDialog={showDialog}
            setShowDialog={setShowDialog}
          />
        )}
      </motion.div>
    </div>
  );
};

export default TailorBusinessProfile;