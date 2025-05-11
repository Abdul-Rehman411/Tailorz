import { useState, useContext } from "react";
import UserContext from "@/utils/UserContext";
import SimpleButton from "./SimpleButton";
import { LinkIcon } from "../../public/icons/svgIcons";
import Image from "next/image";

const TailorApplicationForm = ({ onNext }) => {
  const [formData, setFormData] = useState({
    businessName: "",
    countryCode: "+92",
    businessPhone: "",
    businessAddress: "",
    description: "",
  });

  const {
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!formData.businessName.trim()) {
      setShowMessage({
        type: "info",
        message: "Enter your business name",
      });
      setPopUpMessageTrigger("true");
      return;
    } else if (formData.businessName.length < 3) {
      setShowMessage({
        type: "info",
        message: "Business Name too short",
      });
      setPopUpMessageTrigger("true");
      return;
    }

    if (!formData.businessPhone.trim()) {
      setShowMessage({
        type: "warning",
        message: "Business phone number is required",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (
      formData.businessPhone.length < 7 ||
      formData.businessPhone.length > 10
    ) {
      setShowMessage({
        type: "warning",
        message: "Please enter a valid business phone number",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (formData.businessPhone.startsWith("0")) {
      setShowMessage({
        type: "warning",
        message: "Please remove prefix (0) from phone number",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (!/^\d*$/.test(formData.businessPhone)) {
      setShowMessage({
        type: "warning",
        message: "Phone number can only contain digits",
      });
      setPopUpMessageTrigger("true");
      return;
    }
    if (!formData.businessAddress.trim()) {
      setShowMessage({
        type: "warning",
        message: "Business address is required",
      });
      setPopUpMessageTrigger(true);
      return;
    }
    onNext(formData); // Pass form data to the next component
  };

  return (
    <div className="max-w-[99.5%] min-h-[97%] h-fit mx-auto flex items-center justify-center w-auto px-6 rounded-lg select-none">
      <div
        className={`p-6 h-full rounded-lg ${theme.mainTheme} flex flex-wrap justify-center items-center md:flex-nowrap w-full relative`}
      >
        <div className="w-full md:w-1/2 h-auto flex justify-center md:justify-start">
          <Image
            className="max-w-full p-4 w-[85%]"
            src="/graphics/business-info.webp"
            alt="Become a Tailor"
            width={600} // Specify the width
            height={400} // Specify the height
            priority // Optional: Use for better performance if this is an important image
          />
        </div>
        <div className="w-full md:w-1/2 mt-6 md:mt-0">
          <h2
            className={`flex text-xl md:text-4xl text-${theme.themeColor} font-bold mb-4`}
          >
            Become A Tailor
          </h2>
          <form className="w-full" onSubmit={handleNext} noValidate>
            <div className="relative mb-4">
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className={`${inputStyles}`}
                placeholder=" "
              />
              <label className={`${placeHolderStyles}`} htmlFor="businessName">
                Business Name
              </label>
            </div>
            <div className="relative mb-4">
              <div className="flex">
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
                  {/* Add more countries if you want */}
                </select>
                <input
                  type="tel"
                  id="businessPhone"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  className={`ml-3 ${inputStyles}`}
                  placeholder=" "
                />
                <label
                  className={`ml-24 ${placeHolderStyles}`}
                  htmlFor="businessPhone"
                >
                  Business Phone (WhatsApp)
                </label>
              </div>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                id="businessAddress"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                className={`${inputStyles}`}
                placeholder=" "
              />
              <label
                className={`${placeHolderStyles}`}
                htmlFor="businessAddress"
              >
                Business Address
              </label>
            </div>
            <div className="relative mb-4">
              <textarea
                maxLength={250}
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`${inputStyles} min-h-9 max-h-[130px]`}
                placeholder=" "
              />
              <label className={`${placeHolderStyles}`} htmlFor="description">
                Description <span className="text-xs">(Optional)</span>
              </label>
            </div>
            <SimpleButton
              btnText={"Next"}
              type={"primary-submit"}
              extraclasses={"w-full"}
            />
            <div className="items-start justify-start flex flex-row mt-8">
              <span
                className={`${theme.iconColor} ${theme.hoverText} flex cursor-pointer`}
                onClick={() => window.open("/terms/tailors", "_blank")}
              >
                Read terms for tailors &nbsp;
                <LinkIcon color={theme.iconColor} size={"5"} />
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TailorApplicationForm;
