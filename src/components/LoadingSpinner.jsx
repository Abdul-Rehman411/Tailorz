import React, { useState, useEffect } from "react";
import { PuffLoader, BounceLoader } from "react-spinners";

function LoadingSpinner({ size, extraClasses }) {
  return (
    <div className={`flex justify-center items-center ${extraClasses}`}>
      <PuffLoader color="#ffffff" size={size} speedMultiplier={0.7} />
    </div>
  );
}

const ShiftingBounceLoader = ({ size }) => {
  const [color, setColor] = useState("rgba(52, 152, 219, 1)"); // Starting color
  const [step, setStep] = useState(0);

  useEffect(() => {
    const colors = [
      "rgba(52, 152, 219, 1)", // Blue
      "rgba(231, 76, 60, 1)", // Red
      "rgba(241, 196, 15, 1)", // Yellow
      "rgba(155, 89, 182, 1)", // Purple
      "rgba(20, 189, 52, 1)", // Green
    ];

    const transitionDuration = 1500; // 1.5 seconds for each transition
    const frameRate = 50; // Update every 50ms
    const steps = transitionDuration / frameRate; // Total steps per transition

    let frame = 0;

    const transitionColors = setInterval(() => {
      const currentColor = colors[step];
      const nextColor = colors[(step + 1) % colors.length];

      // Parse RGB components
      const [r1, g1, b1] = currentColor.match(/\d+/g).map(Number);
      const [r2, g2, b2] = nextColor.match(/\d+/g).map(Number);

      // Calculate intermediate color
      const r = Math.round(r1 + (frame / steps) * (r2 - r1));
      const g = Math.round(g1 + (frame / steps) * (g2 - g1));
      const b = Math.round(b1 + (frame / steps) * (b2 - b1));

      setColor(`rgba(${r}, ${g}, ${b}, 1)`);

      frame++;

      if (frame > steps) {
        frame = 0; // Reset frame count
        setStep((prevStep) => (prevStep + 1) % colors.length); // Move to the next color
      }
    }, frameRate);

    return () => clearInterval(transitionColors); // Cleanup on component unmount
  }, [step]);
  return <BounceLoader size={size} color={color} speedMultiplier={0.6} />;
};

export { ShiftingBounceLoader, LoadingSpinner };
