import React, { useState } from "react";
import { RgbaColorPicker } from "react-colorful";

const ColorPicker = ({ onColorChange }) => {
  const [color, setColor] = useState({ r: 209, g: 207, b: 201, a: 1 });

  const handleColorChange = (color) => {
    setColor(color);
    const hexColor = `#${(
      (1 << 24) |
      (color.r << 16) |
      (color.g << 8) |
      color.b
    )
      .toString(16)
      .slice(1)}`;
    onColorChange(hexColor, color.a); // Send color and opacity
  };

  return (
    <div>
      <RgbaColorPicker color={color} onChange={handleColorChange} />
    </div>
  );
};

export default ColorPicker;
