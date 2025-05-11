"use client";
import React, { useContext, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/utils/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import UserContext from "@/utils/UserContext";
import { ClipLoader } from "react-spinners";

const GoogleLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    setUserLoggedIn,
    setUserData,
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
  } = useContext(UserContext);

  useEffect(() => {
    const handleGoogleLogin = async () => {
      // Extract the token from the hash fragment
      const hash = window.location.hash.substring(1); // Remove the `#` at the beginning
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");

      if (!accessToken) {
        router.push("/login");
        return;
      }

      try {
        setIsLoading(true);

        // Use Firebase's GoogleAuthProvider with the access token
        const credential = GoogleAuthProvider.credential(null, accessToken);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        // Check if user exists in Firestore
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("uid", "==", user.uid));
        const userSnapshot = await getDocs(userQuery);

        let userData;

        if (userSnapshot.empty) {
          // User is logging in for the first time; add to Firestore
          userData = {
            uid: user.uid,
            fullName: user.displayName,
            email: user.email,
            phone: user.phoneNumber || "",
            photoURL: user.photoURL,
          };

          // Add the user to Firestore with a generated document ID
          addDoc(usersRef, userData);
        } else {
          // User already exists; fetch their data
          userData = userSnapshot.docs[0].data();
        }

        // Store user data in session and local storage
        sessionStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("userData", JSON.stringify(userData));

        // Update app state
        setUserLoggedIn(true);
        setUserData(userData);
        setShowMessage({
          type: "success",
          message: "Google sign in successful!",
        });
        setPopUpMessageTrigger("true");

        // Redirect to home
        router.push("/user");
      } catch (err) {
        if (err.code === "auth/user-disabled") {
          setShowMessage({
            type: "danger",
            message: "Account blocked! Please contact support",
          });
          setPopUpMessageTrigger("true");
          router.push("/login");
        }
        console.log(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    handleGoogleLogin();
  }, [
    searchParams,
    router,
    setUserLoggedIn,
    setUserData,
    setShowMessage,
    setPopUpMessageTrigger,
  ]);

  if (isLoading) {
    return (
      <div
        className={`max-w-[99.5%] mx-auto my-4 md:my-1 rounded-lg flex flex-col justify-center items-center text-2xl h-full ${theme.mainTheme} ${theme.colorText}`}
      >
        <i className="fab fa-google text-6xl mb-4"></i>
        <div className="flex items-center space-x-2">
          <span>Signing you in with Google</span>
          <ClipLoader size={30} color="#ffffff" />
        </div>
      </div>
    );
  }

  return null; // Component doesn't render anything if login is successful
};

export default GoogleLogin;
