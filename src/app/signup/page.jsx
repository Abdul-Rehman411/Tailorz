"use client";
import React, { useContext, useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SimpleButton from "@/components/SimpleButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserContext from "@/utils/UserContext";
import { auth, db } from "@/utils/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import Image from "next/image";
import OptionSelector from "@/components/OptionSelector";
import Footer from "@/components/Footer";

const SignUpForm = () => {
  const {
    theme,
    setUserData,
    userLoggedIn,
    setUserLoggedIn,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    gender: "",
    age: "",
    countryCode: "+92",
    phone: "",
  });

  const genders = [
    { value: "", label: "Gender" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email+profile+phone`;
    window.location.href = authUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate Name
    if (!formData.fullName.trim()) {
      setShowMessage({
        type: "info",
        message: "Enter your full name",
      });
      setPopUpMessageTrigger("true");
      return;
    } else if (formData.fullName.length < 3) {
      setShowMessage({
        type: "info",
        message: "Name must be at least 3 characters",
      });
      setPopUpMessageTrigger("true");
      return;
    }

    // Validate Email
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setShowMessage({
        type: "warning",
        message: "Enter a valid email",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    // Validate Age
    const ageValue = formData.age.trim();
    if (!ageValue || isNaN(ageValue) || +ageValue < 10 || +ageValue > 100) {
      setShowMessage({
        type: "info",
        message: "Enter a valid age between 10 and 100 with no spaces",
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

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        countryCode: formData.countryCode,
        phone: formData.phone,
      });
      setShowMessage({
        type: "success",
        message: "Registration successful!",
      });
      setPopUpMessageTrigger("true");
      setUserLoggedIn(true);

      const userData = {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        phone: formData.phone,
        countryCode: formData.countryCode,
      };
      sessionStorage.setItem("userData", JSON.stringify(userData));
      localStorage.setItem("userData", JSON.stringify(userData));
      setUserData(userData);
      router.push("/user");
    } catch (error) {
      let errorMessage = "An error occurred: " + ` ${error.message}`;
      let errorType = "danger";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use";
        errorType = "warning";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password must be at least 6 characters";
        errorType = "warning";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Enter a valid email";
        errorType = "info";
      } else if (error.code === "auth/missing-password") {
        errorMessage = "Enter a password";
        errorType = "info";
      }
      setShowMessage({ type: errorType, message: errorMessage });
      setPopUpMessageTrigger("true");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLoggedIn) {
      router.push("/user");
    }
  }, [userLoggedIn, router]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[99.5%] mx-auto flex items-center justify-center w-auto rounded-t-lg select-none">
        <div
          className={`p-6 min-h-full rounded-t-lg ${theme.mainTheme} flex flex-wrap justify-center items-center md:flex-nowrap w-full relative`}
        >
          <div className="w-full md:w-1/2 h-auto flex justify-center md:justify-start">
            <Image
              className="max-w-full p-12 w-auto"
              src="/graphics/signup-animate.gif"
              alt="This is the signup Image."
              width={500} // Specify the width
              height={500} // Specify the height
              priority // Optional: for high-priority images like login
            />
          </div>
          <div className="w-full md:w-1/2 mt-6 md:mt-0">
            <h2
              className={`flex text-xl md:text-4xl ${theme.colorText} font-bold mb-4`}
            >
              Create Account
            </h2>
            <form className="w-full" onSubmit={handleSubmit} noValidate>
              <div className="relative mb-4">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`${inputStyles}`}
                  placeholder=" "
                />
                <label className={`${placeHolderStyles}`} htmlFor="fullName">
                  Full Name
                </label>
              </div>
              <div className="relative mb-4">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputStyles}`}
                  placeholder=" "
                />
                <label className={`${placeHolderStyles}`} htmlFor="email">
                  Email
                </label>
              </div>
              <div className="relative mb-4">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputStyles}`}
                  placeholder=" "
                />
                <label className={`${placeHolderStyles}`} htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative mb-4">
                <OptionSelector
                  options={genders}
                  value={formData.gender}
                  onChange={handleChange}
                  name="gender"
                  classes="w-full"
                />
              </div>
              <div className="relative mb-4">
                <input
                  type="tel"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={`${inputStyles}`}
                  placeholder=" "
                />
                <label className={`${placeHolderStyles}`} htmlFor="age">
                  Age <span className="text-xs"></span>
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
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`ml-3 ${inputStyles}`}
                    placeholder=" "
                  />
                  <label
                    className={`ml-24 ${placeHolderStyles}`}
                    htmlFor="phone"
                  >
                    Phone Number
                  </label>
                </div>
              </div>
              <SimpleButton
                btnText={isLoading ? <LoadingSpinner size={24} /> : "Sign Up"}
                type={"primary-submit"}
                extraclasses={"w-full"}
                disabled={isLoading}
              />
              <div className="my-4 flex items-center justify-center">
                <SimpleButton
                  btnText={
                    <div className="flex items-center justify-center gap-2">
                      <i className="fab fa-google"></i>
                      <span>Continue with Google</span>
                    </div>
                  }
                  type={"danger"}
                  extraclasses={`w-full bg-rose-500`}
                  onClick={handleGoogleLogin}
                />
              </div>
              <div className="items-start justify-start flex flex-row mt-8">
                <span>Returning user?&nbsp;</span>
                <Link href={"/login"}>
                  <span className={`${theme.iconColor} ${theme.hoverText}`}>
                    Click to Login
                  </span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUpForm;
