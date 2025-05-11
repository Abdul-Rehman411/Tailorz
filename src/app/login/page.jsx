"use client";
import React, { useContext, useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/utils/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SimpleButton from "@/components/SimpleButton";
import Link from "next/link";
import UserContext from "@/utils/UserContext";
import { BarLoader } from "react-spinners";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Footer from "@/components/Footer";

const LoginForm = () => {
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
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    );

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=email%20profile%20phone`;
    window.location.href = authUrl;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setShowMessage({
        type: "warning",
        message: "Please provide a valid email address",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        // Store userData in localSession
        sessionStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("userData", JSON.stringify(userData));

        // set the user logged in state to true
        setUserData(userData);
        setUserLoggedIn(true);
      }
    } catch (error) {
      let errorMessage = "An error occurred: " + ` ${error.message}`;
      let errorType = "danger";
      if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid credentials";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Provide a valid email";
        errorType = "info";
      } else if (error.code === "auth/missing-password") {
        errorMessage = "Enter a password";
        errorType = "info";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Account blocked! Please contact support";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later!";
      }
      setShowMessage({ type: errorType, message: errorMessage });
      setPopUpMessageTrigger("true");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for redirect parameter and navigate accordingly
  useEffect(() => {
    if (userLoggedIn) {
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/user");
      }
    }
  }, [userLoggedIn, router, searchParams]);

  const handlePasswordReset = async () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setShowMessage({
        type: "warning",
        message: "Provide a valid email",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    try {
      setIsResetLoading(true);
      await sendPasswordResetEmail(auth, formData.email);
      setShowMessage({
        type: "success",
        message:
          "If you've provided a valid email, you'll receive a password reset email",
      });
      setPopUpMessageTrigger(true);
    } catch (error) {
      setShowMessage({
        type: "danger",
        message: "Error sending password reset email. Please try again",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[99.5%] mx-auto flex items-center justify-center w-auto rounded-t-lg select-none">
        <div
          className={`p-6 h-full rounded-t-lg ${theme.mainTheme} flex flex-wrap justify-center items-center md:flex-nowrap w-full relative`}
        >
          <div className="w-full md:w-1/2 h-auto flex justify-center md:justify-start">
            <Image
              className="max-w-full p-12 w-auto"
              src="/graphics/login-image.png"
              alt="This is the login Image."
              width={500} // Specify the width
              height={500} // Specify the height
              priority // Optional: for high-priority images like login
            />
          </div>
          <div className="w-full md:w-1/2 mt-6 md:mt-0">
            <h2
              className={`flex text-xl md:text-4xl ${theme.colorText} font-bold mb-4`}
            >
              Login
            </h2>
            <form className="w-full" onSubmit={handleSubmit} noValidate>
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
              <SimpleButton
                btnText={isLoading ? <LoadingSpinner size={24} /> : "Login"}
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
                <span>Forgot Password? &nbsp;</span>
                {isResetLoading ? (
                  <BarLoader color="#0000ff" width={137} />
                ) : (
                  <span
                    className={`cursor-pointer ${theme.iconColor} ${theme.hoverText}`}
                    onClick={handlePasswordReset}
                  >
                    Reset
                  </span>
                )}
              </div>
              <div className="items-start justify-start flex flex-row mt-8">
                <span>Need an account? &nbsp;</span>
                <Link href={"/signup"}>
                  <span className={`${theme.iconColor} ${theme.hoverText}`}>
                    Singup Now
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

export default LoginForm;
