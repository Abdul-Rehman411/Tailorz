"use client";
import SimpleButton from "./SimpleButton";
import { motion } from "framer-motion";
import Logo from "./Logo";
import Link from "next/link";
import UserContext from "@/utils/UserContext";
import { useContext } from "react";

const Footer = () => {
  const { theme, inputStyles, placeHolderStyles } = useContext(UserContext);
  const year = new Date().getFullYear();

  const socialLinks = {
    facebook: "https://www.facebook.com/profile.php?id=61575302895431",
    linkedin: "https://www.linkedin.com/company/107202971",
    youtube: "https://youtube.com/@tailoreaseplatform?si=pXMDwaLdXmXtQkri",
    twitter: "#",
  };
  return (
    <>
      <footer
        className={`${theme.mainTheme} py-10 px-3 max-w-[99.5%] mx-auto flex items-center justify-center w-auto rounded-b-lg select-none`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Logo + About */}
            <div className="space-y-6">
              <Logo />
              <p className={`${theme.subTextColor}`}>
                Revolutionizing the tailoring industry with cutting-edge
                technology and personalized experiences.
              </p>
              <div className="flex gap-4">
                {Object.entries(socialLinks).map(([platform, url]) => (
                  <motion.a
                    key={platform}
                    whileHover={{ y: -5 }}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition duration-300 shadow-md"
                  >
                    <i className={`fab fa-${platform}`}></i>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className={`text-xl font-bold mb-6 ${theme.colorText}`}>
                Quick Links
              </h3>
              <ul className="space-y-3">
                {[
                  { href: "/about-us", text: "About Us", icon: "info-circle" },
                  { href: "/contact-us", text: "Contact Us", icon: "envelope" },
                  { href: "/market", text: "Marketplace", icon: "store" },
                  { href: "/tailors", text: "Find Tailors", icon: "user-tie" },
                  {
                    href: "/privacy",
                    text: "Privacy Policy",
                    icon: "shield-alt",
                  },
                ].map(({ href, text, icon }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className={`${theme.hoverText} hover:underline flex items-center transition-colors`}
                    >
                      <i
                        className={`fas fa-${icon} text-xs mr-3 opacity-70`}
                      ></i>
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className={`text-xl font-bold mb-6 ${theme.colorText}`}>
                Contact Us
              </h3>
              <ul className={`${theme.subTextColor} space-y-4`}>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-blue-200 flex items-center justify-center mr-3 mt-1">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <a
                    href="mailto:support@tailorease.com"
                    className="hover:underline"
                  >
                    support@tailorease.com
                  </a>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-green-700 text-green-200 flex items-center justify-center mr-3 mt-1">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <a
                    href="https://wa.me/923108646268"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    +92 (310) 8646268
                  </a>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-red-700 text-red-200 flex items-center justify-center mr-3 mt-1">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <span>3rd Floor, Ufone Tower, Islamabad</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className={`text-xl font-bold mb-6 ${theme.colorText}`}>
                Newsletter
              </h3>
              <p className={`${theme.subTextColor} mb-4`}>
                Subscribe to our newsletter for the latest updates and offers.
              </p>
              <form className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    id="newsletter-email"
                    className={`${inputStyles}`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="newsletter-email"
                    className={`${placeHolderStyles}`}
                  >
                    Your Email
                  </label>
                </div>
                <SimpleButton
                  btnText={
                    <div className="flex items-center justify-center">
                      Subscribe <i className="fas fa-paper-plane ml-2"></i>
                    </div>
                  }
                  extraclasses="w-full py-3"
                  type="primary"
                />
              </form>
            </div>
          </div>

          <div
            className={`border-t ${theme.colorBorder} mt-12 pt-6 text-center ${theme.subTextColor}`}
          >
            © {year} TailorEase. All Rights Reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
