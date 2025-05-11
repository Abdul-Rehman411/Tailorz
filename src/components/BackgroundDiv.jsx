"use client";

import { useContext } from "react";
import { UserContext } from "@/utils/UserContext";

const BackgroundDiv = ({ children }) => {
  const { theme } = useContext(UserContext);

  return (
    <div
      className="relative flex h-screen w-screen"
      style={{
        backgroundImage: theme.bgImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
    </div>
  );
};

export default BackgroundDiv;
