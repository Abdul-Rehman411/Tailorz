import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingInfoBubble({
  text,
  type = "info",
  extraClasses = "",
  icon,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const typeConfig = {
    info: { color: "text-blue-700", bg: "bg-blue-100" },
    warning: { color: "text-yellow-800", bg: "bg-yellow-100" },
    error: { color: "text-red-700", bg: "bg-red-100" },
    success: { color: "text-green-700", bg: "bg-green-100" },
  };
  const { color, bg } = typeConfig[type] || typeConfig.info;

  return (
    <div className={`relative inline-block ${extraClasses} z-50`}>
      <div
        className={`${color} text-xl cursor-pointer ${
          isOpen ? "opacity-100" : "opacity-40"
        }`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {icon}{" "}
        {isOpen && (
          <motion.i
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fas fa-chevron-left absolute top-1 ml-1 text-xl"
          ></motion.i>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`absolute top-0 left-full ml-4 px-3 py-1 rounded shadow-md text-sm whitespace-nowrap ${bg} ${color} overflow-visible z-50`}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
