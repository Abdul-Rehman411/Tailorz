import { useContext } from "react";
import UserContext from "@/utils/UserContext";
import { motion } from "framer-motion";

function SimpleButton({
  onClick,
  btnText,
  type,
  extraclasses = "",
  disabled,
  icon = null,
}) {
  const { theme } = useContext(UserContext);

  const baseStyles =
    "flex items-center justify-center px-4 py-2 rounded-md font-medium duration-500 select-none focus:outline-none transition-all hover:ring-2";

  const themeStyles = {
    "midnight-whisper": {
      primary: "bg-gray-800 text-white hover:bg-gray-700 ring-gray-900",
      default: "bg-gray-400 text-black hover:bg-gray-300 ring-gray-700",
      accent: "bg-purple-600 text-white hover:bg-purple-400 ring-purple-600",
    },
    "lunar-glow": {
      primary: "bg-sky-800 text-white hover:bg-sky-500 ring-sky-800",
      default: "bg-white text-gray-900 hover:bg-gray-400 ring-white",
      accent: "bg-teal-600 text-white hover:bg-teal-500 ring-teal-800",
    },
    "neon-punk": {
      primary: "bg-slate-800 text-pink-200 hover:bg-sky-900/75 ring-pink-500",
      default: "bg-pink-700 text-blue-200 hover:bg-pink-500/75 ring-blue-600",
      accent: "bg-yellow-600 text-black hover:bg-yellow-300/75 ring-yellow-800",
    },
  };

  const dangerStyles = "bg-red-700 text-white hover:bg-red-400/75 ring-red-800";

  const disabledStyles = "opacity-50 cursor-not-allowed";

  const getButtonStyle = () => {
    const themeType = themeStyles[theme.mainTheme] || themeStyles["lunar-glow"];
    switch (type) {
      case "primary":
      case "primary-submit":
        return themeType.primary;
      case "accent":
        return themeType.accent;
      case "danger":
        return dangerStyles;
      default:
        return themeType.default;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, opacity: 0.85 }}
      transition={{ duration: 0.01 }}
      type={type === "primary-submit" ? "submit" : "button"}
      className={`${baseStyles} ${getButtonStyle()} ${
        disabled ? disabledStyles : ""
      } ${extraclasses}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {btnText}
    </motion.button>
  );
}

export default SimpleButton;
