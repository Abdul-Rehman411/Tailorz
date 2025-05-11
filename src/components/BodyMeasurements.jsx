"use client";
import { useState, useEffect, useContext } from "react";
import { db } from "@/utils/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import UserContext from "@/utils/UserContext";
import { ClipLoader } from "react-spinners";
import SimpleButton from "./SimpleButton";
import { LoadingSpinner } from "./LoadingSpinner";
import DialogBox from "./DialogBox";
import MeasurementFormAI from "./MeasurementFormAI";
import { motion, AnimatePresence } from "framer-motion";
import { AiIcon } from "../../public/icons/svgIcons";

const measurementFields = [
  { key: "chest", label: "Chest", icon: "ruler-vertical" },
  { key: "shoulder", label: "Shoulder Width", icon: "arrows-left-right" },
  { key: "torso", label: "Torso Length", icon: "ruler-vertical" },
  { key: "sleeve", label: "Sleeve Length", icon: "ruler-horizontal" },
  { key: "neck", label: "Neck Circumference", icon: "circle-notch" },
  { key: "armhole", label: "Armhole Circumference", icon: "circle-notch" },
  { key: "cuff", label: "Cuffs", icon: "circle-notch" },
  { key: "waist", label: "Waist", icon: "ruler-horizontal" },
  { key: "hips", label: "Hips", icon: "ruler-horizontal" },
  { key: "legs", label: "Legs Length", icon: "ruler-vertical" },
  { key: "thigh", label: "Thigh Circumference", icon: "circle-notch" },
  { key: "legOpening", label: "Leg Opening", icon: "circle-notch" },
];

const BodyMeasurements = ({ uid, authorization }) => {
  const { theme, setShowMessage, setPopUpMessageTrigger } =
    useContext(UserContext);
  const [editingField, setEditingField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = useState({});
  const [useInches, setUseInches] = useState(null);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [userInfo, setUserInfo] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
  });

  // Fetch measurements from Firestore
  useEffect(() => {
    try {
      const fetchData = async () => {
        const docRef = doc(
          db,
          "settings",
          uid,
          "user_settings",
          "measurements"
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMeasurements(docSnap.data());
        }
      };

      fetchData();
    } catch (error) {
      console.log(error.message);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    }
  }, [setMeasurements, uid]);

  const handleSaveMeasurements = async () => {
    if (!authorization) {
      setShowMessage({
        type: "danger",
        message: "You're not authorized to make changes to these measurements",
      });
      setPopUpMessageTrigger(true);
      return;
    }
    try {
      setSavingMeasurements(true);
      const docRef = doc(db, "settings", uid, "user_settings", "measurements");
      await setDoc(docRef, measurements, { merge: true });
      setShowMessage({
        type: "success",
        message: "Measurements saved successfully!",
      });
      setPopUpMessageTrigger(true);
      localStorage.setItem("useInches." + uid, useInches);
    } catch (error) {
      setShowMessage({
        type: "danger",
        message: "Failed to save measurements: " + error.message,
      });
      setPopUpMessageTrigger(true);
    } finally {
      setSavingMeasurements(false);
    }
  };

  const isGenerationFormValid = () => {
    const { age, gender, height, weight } = userInfo;

    if (!gender || !age || !height || !weight) return false;

    return (
      age >= 3 &&
      age <= 110 &&
      height >= 40 &&
      height <= 250 &&
      weight >= 5 &&
      weight <= 200
    );
  };

  const { GoogleGenerativeAI } = require("@google/generative-ai");

  // Setup
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 5500,
    responseMimeType: "application/json",
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig,
  });

  const measurementsPrompt = `
Generate estimated body measurements using the given user details (user weight is in KG and height is in centimeters).
Your response should ONLY contain a raw JavaScript object using this format with one exact value for each:

{
  chest: number,
  shoulder: number,
  torso: number,
  sleeve: number,
  neck: number,
  armhole: number,
  cuff: number,
  waist: number,
  hips: number,
  legs: number,
  thigh: number,
  legOpening: number
}

Guidelines:
- Units: All in centimeters (cm).
- Values should be logical, proportionate, and realistic.
- DO NOT add any explanation or extra text.
- DO NOT wrap the response in quotes or Markdown.
`;

  async function generateResponse(userInput) {
    const result = await model.generateContent(
      `${measurementsPrompt}\n\nUser Info:\n${JSON.stringify(userInput)}`
    );

    const responseText = result.response.text();

    try {
      const measurements = JSON.parse(responseText);
      return measurements;
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      return null;
    }
  }

  const handleGenerate = async () => {
    setShowDialog(false);
    try {
      setIsLoading(true);
      const generated = await generateResponse(userInfo);
      if (generated) {
        setMeasurements(generated);
        setShowMessage({
          type: "success",
          message: "AI-generated measurements ready! Review and save them.",
        });
        setPopUpMessageTrigger(true);
      }
      setUseInches(false);
    } catch (error) {
      console.log(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("useInches." + uid);
    setUseInches(saved === "true");
  }, [uid]);

  const toggleMeasurementUnits = () => {
    setMeasurements((prev) => {
      const toInches = !useInches;
      const converted = {};
      for (const key in prev) {
        const value = prev[key];
        converted[key] = toInches
          ? Math.round((value / 2.54) * 2) / 2 // cm ➜ inches (0.5 precision)
          : Math.round(value * 2.54); // inches ➜ cm (nearest whole number)
      }
      return converted;
    });
    setUseInches((prev) => !prev);
  };

  const handleEdit = (key) => {
    setEditingField(key);
  };

  const handleChange = (e, key) => {
    setMeasurements((prev) => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mt-8 rounded-xl shadow-lg bg-opacity-50 p-6`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6">
        <div className="block lg:flex items-center mb-4 sm:mb-0">
          <i
            className={`fas fa-ruler-combined text-2xl mr-3 ${theme.iconColor}`}
          ></i>
          <h2 className={`text-2xl font-bold ${theme.colorText}`}>
            Body Measurements
            <span className="block text-sm font-normal opacity-80">
              All values in {useInches ? "inches (in)" : "centimeters (cm)"}
            </span>
          </h2>
          <div
            className={`flex items-center gap-2 md:ml-2 lg:ml-5 md:mt-8 rounded-lg px-3 py-2 ${theme.colorBg}`}
          >
            <span className="text-sm font-medium">cm</span>
            <button
              onClick={toggleMeasurementUnits}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${
                useInches ? "bg-blue-600" : "bg-gray-600"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                  useInches ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium">in</span>
          </div>
        </div>

        {/* BUTTONS — Only show if authorized */}
        {authorization && (
          <div className="flex flex-col lg:flex-row gap-3 w-full sm:w-auto">
            <SimpleButton
              btnText="Generate with AI"
              type="accent"
              icon={<AiIcon />}
              onClick={() => setShowDialog(true)}
              extraclasses="w-full sm:w-auto"
            />
            <SimpleButton
              btnText={
                savingMeasurements ? (
                  <>
                    <LoadingSpinner size={24} extraClasses={"mr-2"} />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save
                  </>
                )
              }
              type="primary"
              extraclasses="w-full sm:w-auto px-5"
              disabled={isLoading || savingMeasurements}
              onClick={handleSaveMeasurements}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {measurementFields.map(({ key, label, icon }) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.04 }}
            className={`p-4 ${theme.colorBg} rounded-lg border ${theme.colorBorder} transition-all duration-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <i className={`fas fa-${icon} mr-2 ${theme.iconColor}`}></i>
                <label className="text-sm font-medium">{label}</label>
              </div>
              {editingField === key && (
                <i className={`fas fa-check text-xs ${theme.iconColor}`}></i>
              )}
            </div>

            {authorization && editingField === key ? (
              <input
                type="number"
                value={measurements[key] || ""}
                onChange={(e) => handleChange(e, key)}
                className={`w-full p-2 rounded-md ${theme.colorBg} ${theme.colorText} ${theme.colorBorder} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                autoFocus
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
              />
            ) : isLoading ? (
              <div className="flex justify-center items-center p-2">
                <ClipLoader size={20} color={theme.iconColor} />
              </div>
            ) : (
              <div
                className={`p-2 rounded-md ${
                  authorization
                    ? "cursor-pointer hover:bg-opacity-30 " + theme.hoverBg
                    : ""
                } transition-colors duration-200 flex justify-between items-center`}
                onClick={() => authorization && handleEdit(key)}
              >
                <span className={measurements[key] ? "" : "opacity-70"}>
                  {measurements[key] || "Click to edit"}
                </span>

                {/* Only show edit icon if authorized */}
                {authorization && (
                  <i
                    className={`fas fa-pencil-alt text-xs ${theme.iconColor}`}
                  ></i>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showDialog && (
          <DialogBox
            title={"AI Measurement Generator"}
            type="info"
            showDialog={showDialog}
            setShowDialog={setShowDialog}
            body={() => (
              <MeasurementFormAI
                userInfo={userInfo}
                setUserInfo={setUserInfo}
                theme={theme}
              />
            )}
            buttons={[
              {
                label: (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Generate
                  </>
                ),
                type: "primary",
                onClick: () => {
                  if (!isGenerationFormValid()) {
                    setShowMessage({
                      message: "Please fill all fields with valid values",
                      type: "warning",
                    });
                    setPopUpMessageTrigger(true);
                    return;
                  }
                  handleGenerate(userInfo);
                },
              },
            ]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BodyMeasurements;
