// src/app/layout.js
import Navbar from "@/components/Navbar"; // Adjust path to Navbar component
import "./globals.css"; // Import global styles
import { UserProvider } from "@/utils/UserContext";
import PopupMessage from "@/components/PopupMessage";
import { Roboto } from "next/font/google";
import ChatBot from "../components/ChatBot";
import BackgroundDiv from "@/components/BackgroundDiv";
import NotificationPanel from "@/components/NotificationPanel";
import { FloatingButtonsHolder } from "@/components/FloatingButtonsHolder";

const roboto = Roboto({
  weight: "400",
  subsets: ["latin"],
});

export const metadata = {
  title: "TailorEase", // Set default title
  description: "AI Enhanced Fitting Experience",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={roboto.className}>
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="relative flex h-screen w-screen">
        <UserProvider>
          <BackgroundDiv>
            <div className={`relative flex h-screen w-screen font-sans`}>
              {/* Navbar with fixed position */}
              <div className="fixed md:relative w-full md:w-40 z-40">
                <Navbar />
              </div>

              {/* Main content with scrollable overflow */}
              <div
                className={`overflow-hidden flex-1 mt-[85px] md:mt-0 px-[1px]`}
              >
                <PopupMessage />
                <FloatingButtonsHolder />
                {children} {/* Renders each page's content */}
              </div>
            </div>
          </BackgroundDiv>
        </UserProvider>
      </body>
    </html>
  );
}
