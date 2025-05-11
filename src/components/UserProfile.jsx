"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";
import useFetchUser from "@/app/hooks/useFetchUser";
import ShareLinkDialog from "./ShareLinkDialog";
import { useRouter } from "next/navigation";

const UserProfile = ({ userData, uid }) => {
  const shareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("share", userData.uid);
    return url.toString();
  };
  const { user, loading } = useFetchUser(uid);
  const displayUser = uid ? user : userData;
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !userData) {
      router.push("/404");
    }
  }, [loading, router, user, userData]);

  return (
    <div className="p-4 text-center">
      <motion.div
        className="p-4 text-center rounded-xl backdrop-blur-xl bg-opacity-90 border"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <h3 className="text-2xl font-bold">
          {uid ? "Shared" : "Your"} Profile
        </h3>

        <div className="mt-4">
          {displayUser ? (
            <>
              <p className="text-lg font-semibold">{displayUser.fullName}</p>
              <p className="text-sm">{displayUser.email}</p>
              <p className="text-sm">
                {displayUser.countryCode}-{displayUser.phone}
              </p>
            </>
          ) : (
            <div className="mt-4">
              <LoadingSpinner size={30} />
            </div>
          )}

          <div className="flex items-center justify-center mt-5">
            {!uid && displayUser && (
              <ShareLinkDialog
                sender={userData}
                shareLink={shareLink()}
                subject={"Profile"}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserProfile;
