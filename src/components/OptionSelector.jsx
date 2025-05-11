import { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import UserContext from "@/utils/UserContext";

const OptionSelector = ({ options, value, onChange, name, classes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme } = useContext(UserContext);

  const dropdownVariants = {
    hidden: { scaleY: 0, transformOrigin: "top" },
    visible: { scaleY: 1, transformOrigin: "top" },
    exit: { scaleY: 0, transformOrigin: "top" },
  };

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`relative inline-block text-left ${classes}`}
      ref={dropdownRef}
    >
      <div
        className={`p-2 flex items-center justify-between outline-none rounded-md cursor-pointer ring-2 ${theme.hoverBg}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {options.find((option) => option.value === value)?.label || "Select"}
        </span>
        {options.find((option) => option.value === value)?.img && (
          <Image
            src={options.find((option) => option.value === value).img}
            alt={`${
              options.find((option) => option.value === value).label
            } flag`}
            width={24} // Matches w-6 (6 * 4 = 24px)
            height={24} // Matches h-6 (6 * 4 = 24px)
            className="flex"
          />
        )}
        <span>{isOpen ? "▲" : "▼"}</span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className={`absolute mt-2 p-2 items-center justify-center rounded-md w-full ${theme.colorBg} z-[999]`}
            initial="hidden"
            animate={isOpen ? "visible" : "hidden"}
            exit="exit"
            variants={dropdownVariants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {options.map((option, index) => (
              <li
                key={index}
                className={`flex justify-between cursor-pointer p-2 rounded-md ${theme.hoverBg}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {option.img && (
                  <Image
                    src={option.img}
                    alt={`${option.label} flag`}
                    width={24} // Matches w-6 (6 * 4 = 24px)
                    height={24} // Matches h-6 (6 * 4 = 24px)
                    className="flex"
                  />
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OptionSelector;
