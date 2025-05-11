"use client";
import { useContext, useState, useEffect } from "react";
import TailorApplicationForm from "@/components/TailorApplicationForm";
import TailorSpecialitiesForm from "@/components/TailorSpecialitiesForm";
import ProgressBar from "@/components/ProgressBar";
import UserContext from "@/utils/UserContext";
import { ClipLoader } from "react-spinners";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, auth } from "@/utils/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
import SimpleButton from "@/components/SimpleButton";

const BecomeTailor = () => {
  const [step, setStep] = useState(1);
  const {
    theme,
    userData,
    userLoggedIn,
    setPopUpMessageTrigger,
    setShowMessage,
  } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [disableResendButton, setDisableResendButton] = useState(false);
  const router = useRouter();

  const [hasBusinessAccount, setHasBusinessAccount] = useState(null);

  useEffect(() => {
    const checkBusinessAccount = async () => {
      if (!userLoggedIn) {
        router.push("/signup");
        return; // Exit if the user is not logged in or `uid` is not available
      }

      try {
        // Query to find a tailor document with ownerId matching the user UID
        const userQuery = query(
          collection(db, "tailors"),
          where("ownerId", "==", userData.uid)
        );
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          // Get the first matching tailor document
          const tailorDoc = querySnapshot.docs[0];
          const { approved } = tailorDoc.data();

          const tailorDocId = querySnapshot.docs[0].id;
          const tailorRef = doc(db, "tailors", tailorDocId);

          if (!approved && auth.currentUser.emailVerified) {
            // If not approved and email is verified, update `approved` to true
            await updateDoc(tailorRef, { approved: true });
            setHasBusinessAccount({
              approved: true,
              exists: true,
            });
            return;
          }

          // Update state with `approved` value and existence flag
          setHasBusinessAccount({
            approved: approved || false, // Use `false` as a default if `approved` is undefined
            exists: true,
          });
        } else {
          // No tailor document found for this ownerId
          setHasBusinessAccount({
            approved: false,
            exists: false,
          });
        }
      } catch (error) {
        console.error("Error checking business account:", error);
      }
    };

    checkBusinessAccount();
  }, [userData, userLoggedIn, router]);

  const stepNames = ["Business Info", "Additional Info", "Submitting"];

  // Handle next step: collect form data and move to step 2
  const handleNext = (data) => {
    setFormData({ ...formData, ...data }); // Combine form data
    setTimeout(() => {
      setStep(step + 1); // Move to the next step
    }, 300); // Delay to allow animation time
  };

  // Handle back to step 1
  const handleBack = () => {
    setStep(1); // Go back to step 1
  };

  // Final submit: combine data and handle form submission
  const handleSubmit = async (finalData) => {
    const combinedData = { ...formData, ...finalData };

    // Extract `businessPicture` from `combinedData` to avoid storing it directly in Firestore
    const { businessPicture, ...dataWithoutPicture } = combinedData;

    setIsLoading(true);
    try {
      // 1. Upload the image to a local directory in the project at "./images/profile/business"
      let businessPictureUrl = "";
      if (businessPicture) {
        const fileName = `business-${Date.now()}.jpg`; // Unique file name
        const targetPath = "images/profile/business"; // Dynamic storage path

        // Fetch API call to the reusable route.js route
        const response = await fetch("/api/imageUpload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageData: businessPicture, // Base64 encoded image
            fileName,
            targetPath,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Image upload failed: ${errorText}`);
        }

        const { url } = await response.json();
        businessPictureUrl = "/" + url; // Public URL of the uploaded image
      }

      // 2. Add business details to the "tailors" collection in Firestore
      const tailorsRef = collection(db, "tailors");
      const tailorDocRef = await addDoc(tailorsRef, {
        ...dataWithoutPicture,
        businessPictureUrl: businessPictureUrl,
        approved: false,
        status: "active",
        ownerId: userData.uid,
        rating: 0,
        total_rating: 0,
      });

      // Get the newly created document ID
      const bId = tailorDocRef.id;

      // 3. Update the user document with the new business ID (bId)
      const userQuery = query(
        collection(db, "users"),
        where("uid", "==", userData.uid)
      );
      const querySnapshot = await getDocs(userQuery);

      const docId = querySnapshot.docs[0].id;
      const userDocRef = doc(db, "users", docId);
      await updateDoc(userDocRef, {
        bId: bId,
      });

      // 4. Send a verification email to the user
      await sendEmailVerification(auth.currentUser);

      // 5. Update bId in local storage
      let UpdatedUserData = JSON.parse(localStorage.getItem("userData")) || {};
      UpdatedUserData.bId = bId;
      localStorage.setItem("userData", JSON.stringify(UpdatedUserData));
      sessionStorage.setItem("userData", JSON.stringify(UpdatedUserData));

      setShowMessage({
        type: "success",
        message:
          "A verification email has been sent. Please verify to activate your business account.",
      });
      setPopUpMessageTrigger(true);
      setHasBusinessAccount({
        approved: false,
        exists: true,
      });
    } catch (error) {
      console.error("Error submitting business application:", error);
      setShowMessage({
        type: "error",
        message:
          "There was an error submitting your application. Please try again.",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      setDisableResendButton(true);
      await sendEmailVerification(auth.currentUser);
      setShowMessage({
        type: "success",
        message:
          "A verification email has been sent. Please verify to activate your business account.",
      });
      setPopUpMessageTrigger(true);
    } catch (error) {
      setShowMessage({
        type: "danger",
        message: "Couldn't send verification email: " + error,
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasBusinessAccount === null) {
    return (
      <div
        className={`max-w-[99.5%] mx-auto my-4 md:my-1 flex justify-center items-center rounded-lg h-full ${theme.mainTheme}`}
      >
        <ClipLoader size={60} color="#ffffff" />
      </div>
    ); // Loading indicator while checking
  }

  return hasBusinessAccount.exists ? (
    !hasBusinessAccount.approved ? (
      <div
        className={`max-w-[99.5%] mx-auto my-4 md:my-1 rounded-lg flex flex-col justify-center items-center h-full ${theme.mainTheme}`}
      >
        <div
          className={`flex p-5 rounded-lg flex-col items-center text-center ${theme.colorBg}`}
        >
          <span className="text-2xl">Your business account is pending!</span>
          <span>
            Please check your email for a confirmation email from TailorEase to
            continue to your business dashboard.
          </span>
          <span className="my-5">
            If you have verified your email and you still see this message, your
            Business Account might be suspended. Please
            <Link
              href={"/contact-us"}
              className={`font-bold text-xl ${theme.iconColor} ${theme.hoverText}`}
            >
              {" "}
              contact us here{" "}
            </Link>
            for customer support
          </span>

          <div className="flex space-x-3">
            <Link href={"/"}>
              <SimpleButton
                btnText={"Go Home"}
                type={"primary"}
                extraclasses={"py-2 px-5 text-xl"}
              />
            </Link>
            <SimpleButton
              btnText={
                isLoading ? (
                  <LoadingSpinner size={26} />
                ) : (
                  "Resend Confirmation Email"
                )
              }
              type={"primary"}
              extraclasses={"py-2 px-5 text-xl min-w-[298px]"}
              onClick={handleResendEmail}
              disabled={disableResendButton}
            />
          </div>
        </div>
      </div>
    ) : (
      <div
        className={`max-w-[99.5%] mx-auto my-4 md:my-1 flex justify-center items-center rounded-lg h-full ${theme.mainTheme}`}
      >
        <p className="text-2xl mr-5">
          You already have an active business account. Click{" "}
          <a href="/business-dashboard/profile" className="text-blue-700">
            here
          </a>{" "}
          to visit your business dashboard
        </p>
      </div>
    )
  ) : (
    <div className="h-full relative overflow-y-auto overflow-x-hidden">
      <ProgressBar steps={3} currentStep={step} stepNames={stepNames} />
      {/* Step Forms */}
      <div
        className={`w-full h-full absolute transition-transform duration-500 ease-in-out ${
          step === 1 ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <TailorApplicationForm onNext={handleNext} />
      </div>
      <div
        className={`w-full h-full absolute transition-transform duration-500 ease-in-out ${
          step >= 2 ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <TailorSpecialitiesForm
          formData={formData}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default BecomeTailor;
