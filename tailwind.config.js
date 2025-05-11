/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {},
  },
  variants: {},
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow-sm": {
          textShadow: "1px 1px 5px rgba(20, 200, 50, 0.8)",
        },
        ".text-shadow-md": {
          textShadow: "2px 2px 10px rgba(20, 200, 50, 0.9)",
        },
        ".text-shadow-lg": {
          textShadow: "2px 2px 18px rgba(90, 250, 50, 1)",
        },
        ".background-gradient": {
          background:
            "linear-gradient(to right, rgba(0, 10, 10, 0.9), rgba(20, 50, 60, 0.9), rgba(220, 225, 220, 0.9))",
          "-webkit-background-clip": "background",
        },
        ".midnight-whisper": {
          backgroundColor: "rgba(5, 5, 13, 0.57)", // bg-gray-800 bg-opacity-60
          backdropFilter: "blur(25px)", // backdrop-blur-xl
          boxShadow: "0 1px 2px 0 #fde047", // shadow-yellow-300 shadow-sm
          color: "#ffffff", // Set all text to white
          borderColor: "#ffffff", // White border color
        },
        ".lunar-glow": {
          backgroundColor: "rgba(210, 220, 255, 0.75)", // Lighter background
          backdropFilter: "blur(30px)", // backdrop-blur-xl
          boxShadow: "0 6px 9px 0 #34495e", // gray shadow color
          color: "#000000", // Set all text to black
          borderColor: "#000000", // Black border color
        },
        ".neon-punk": {
          backgroundColor: "rgba(53, 71, 131, 0.65)", // sky background
          backdropFilter: "blur(35px)", // backdrop-blur-xl
          boxShadow: "0 3px 8px 0 #8b5cf6", // violet-500
          color: "#FACC15", // Set all text to sky-200
          borderColor: "#1e88e5", // Bluish border color
        },
      };

      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
