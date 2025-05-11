"use client";
import React, { useContext } from "react";
import UserContext from "@/utils/UserContext";

const MeasurementFormAI = ({ userInfo, setUserInfo }) => {
  const { inputStyles, theme } = useContext(UserContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <input
        type="number"
        name="age"
        placeholder="Age"
        value={userInfo.age}
        onChange={handleChange}
        className={`${inputStyles}`}
      />
      <select
        name="gender"
        value={userInfo.gender}
        onChange={handleChange}
        className={`${inputStyles}`}
      >
        <option value="" className={`${theme.colorBg}`}>
          Select Gender
        </option>
        <option value="male" className={`${theme.colorBg}`}>
          Male
        </option>
        <option value="female" className={`${theme.colorBg}`}>
          Female
        </option>
      </select>
      <input
        type="number"
        name="height"
        placeholder="Height (cm)"
        value={userInfo.height}
        onChange={handleChange}
        className={`${inputStyles}`}
      />
      <input
        type="number"
        name="weight"
        placeholder="Weight (kg)"
        value={userInfo.weight}
        onChange={handleChange}
        className={`${inputStyles}`}
      />
    </div>
  );
};

export default MeasurementFormAI;
