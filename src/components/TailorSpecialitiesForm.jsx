import { useState, useContext } from "react";
import UserContext from "@/utils/UserContext";
import { LoadingSpinner } from "./LoadingSpinner";
import SimpleButton from "./SimpleButton";
import { LinkIcon } from "../../public/icons/svgIcons";
import Image from "next/image";

const TailorSpecialitiesForm = ({
  formData,
  onNext,
  onBack,
  onSubmit,
  isLoading,
}) => {
  const [specialitiesData, setSpecialitiesData] = useState({
    specialities: [],
    businessPicture: null,
    experience: "",
    openTime: "",
    closeTime: "",
  });
  const {
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = async (e) => {
    const { name, value, files } = e.target;

    // Validate file type
    if (name === "businessPicture" && files[0]) {
      const file = files[0];
      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        setShowMessage({
          type: "warning",
          message: "Please upload a JPG or PNG image file.",
        });
        setPopUpMessageTrigger(true);
        return;
      }

      try {
        // Convert file to Base64
        const base64 = await convertToBase64(file);

        // Update state with the Base64 image
        setSpecialitiesData({ ...specialitiesData, [name]: base64 });
        setPreviewImage(URL.createObjectURL(file));
      } catch (error) {
        console.error("Error converting file to Base64:", error);
        setShowMessage({
          type: "error",
          message: "Failed to process the image. Please try again.",
        });
        setPopUpMessageTrigger(true);
      }

      return; // Prevent further execution for this case
    }

    if (name === "specialities") {
      const selectedOption = value;
      setSpecialitiesData((prevData) => ({
        ...prevData,
        specialities: prevData.specialities.includes(selectedOption)
          ? prevData.specialities.filter((item) => item !== selectedOption)
          : [...prevData.specialities, selectedOption],
      }));
    } else {
      setSpecialitiesData({ ...specialitiesData, [name]: value });
    }
  };

  // Helper function to convert a file to a Base64 string
  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // Base64 string
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file); // Read file as Base64
    });
  }

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    // Validate profile picture
    if (!specialitiesData.businessPicture) {
      setShowMessage({
        type: "warning",
        message: "Business profile picture is required",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    // Validate opening and closing times
    if (!specialitiesData.openTime || !specialitiesData.closeTime) {
      setShowMessage({
        type: "warning",
        message: "Please specify opening and closing times",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    // Validate experience
    if (specialitiesData.experience < 0 || specialitiesData.experience > 100) {
      setShowMessage({
        type: "warning",
        message: "Enter experience between 0 and 100 years",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    // Validate that at least one speciality is selected
    if (
      !specialitiesData.specialities ||
      !Object.values(specialitiesData.specialities).some(Boolean)
    ) {
      setShowMessage({
        type: "warning",
        message: "Select at least 1 speciality",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    onNext(onNext);

    // Combine form data and specialities data
    const combinedData = { ...formData, ...specialitiesData };

    // Call the parent component's submit handler
    onSubmit(combinedData);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setSpecialitiesData({ ...specialitiesData, businessPicture: file });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-[99.5%] min-h-[97%] mx-auto flex items-center justify-center w-auto p-6 rounded-lg select-none">
      <div
        className={`p-6 h-full rounded-lg ${theme.mainTheme} flex flex-wrap justify-center items-center md:flex-nowrap w-full relative`}
      >
        {/* Image DropZone Section */}
        <div className="w-full p-6 md:w-1/2 h-auto flex flex-col items-center md:items-start">
          {/* Image Dropzone Section */}
          <div
            className="flex items-center justify-center w-full h-96 mb-2 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label
              htmlFor="businessPicture"
              className="flex flex-col items-center justify-center w-full h-full"
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg cursor-pointer"
                  width={300}
                  height={256}
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 cursor-pointer">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG or JPG (MAX. 800x400px)
                  </p>
                </div>
              )}
              <input
                id="businessPicture"
                type="file"
                accept=".jpg, .jpeg, .png"
                name="businessPicture"
                className="hidden"
                onChange={handleChange}
              />
            </label>
          </div>
          {/* Caption Section */}
          <p className="text-sm text-center md:text-left text-gray-500 dark:text-gray-400">
            Upload the image of your business here. This will be displayed on
            your profile.
          </p>
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 mt-6 md:mt-0">
          <h2
            className={`flex text-xl md:text-4xl text-${theme.themeColor} font-bold mb-4`}
          >
            Become A Tailor
          </h2>
          <form
            className="w-full"
            onSubmit={handleFinalSubmit}
            encType="multipart/form-data"
            noValidate
          >
            {/* Experience */}
            <div className="relative mb-4">
              <input
                type="number"
                id="experience"
                name="experience"
                value={specialitiesData.experience}
                min={0}
                max={100}
                onChange={handleChange}
                className={`${inputStyles}`}
                placeholder=" "
              />
              <label className={`${placeHolderStyles}`} htmlFor="experience">
                Experience (in years)
              </label>
            </div>

            {/* Open Hours */}
            <div className="relative mb-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="openTime">Open Time</label>
                  <input
                    type="time"
                    id="openTime"
                    name="openTime"
                    value={specialitiesData.openTime}
                    onChange={handleChange}
                    className={`${inputStyles} -mt-2`}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="closeTime">Close Time</label>
                  <input
                    type="time"
                    id="closeTime"
                    name="closeTime"
                    value={specialitiesData.closeTime}
                    onChange={handleChange}
                    className={`${inputStyles} -mt-2`}
                  />
                </div>
              </div>
            </div>

            {/* Specialties Selection */}
            <div className="relative mb-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Men Specialist",
                  "Women Specialist",
                  "Kids Specialist",
                  "Alterations",
                  "Custom Tailoring",
                  "Other",
                ].map((speciality) => (
                  <div
                    key={speciality}
                    onClick={() =>
                      handleChange({
                        target: { name: "specialities", value: speciality },
                      })
                    }
                    className={`p-2 border rounded-lg cursor-pointer ${
                      specialitiesData.specialities.includes(speciality)
                        ? "bg-blue-500"
                        : `bg-gray-600 ${theme.hoverBg}`
                    }`}
                  >
                    {specialitiesData.specialities.includes(speciality) && (
                      <span className="text-green-500 absolute -translate-y-4 -translate-x-3">
                        ✔
                      </span>
                    )}
                    {speciality}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-center space-x-2 rtl:space-x-reverse">
              <SimpleButton btnText={"Back"} type={"cancel"} onClick={onBack} />
              <SimpleButton
                btnText={
                  isLoading ? (
                    <LoadingSpinner size={24} />
                  ) : (
                    "Submit Application"
                  )
                }
                type={"primary-submit"}
                extraclasses={"w-full"}
                onClick={handleFinalSubmit}
                disabled={isLoading}
              />
            </div>

            <div className="items-start justify-start flex flex-row mt-8">
              <span
                className={`${theme.iconColor} ${theme.hoverText} flex cursor-pointer`}
                onClick={() => window.open("/terms/tailors", "_blank")}
              >
                Read terms for Tailors &nbsp;
                <LinkIcon color={theme.iconColor} size={"5"} />
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TailorSpecialitiesForm;
