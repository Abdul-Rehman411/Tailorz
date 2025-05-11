import { useContext, useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import UserContext from "@/utils/UserContext";
import SimpleButton from "./SimpleButton";

const EXPIRE_KEY = "hideTrendPopExpires";

const TrendPop = () => {
  const { theme, inputStyles, placeHolderStyles } = useContext(UserContext);
  const [city, setCity] = useState("");
  const [trendData, setTrendData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInitial, setShowInitial] = useState(false);
  const [keyword, setKeyword] = useState("");
  const timerRef = useRef(null);

  // memoize AI model
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 5500,
    responseMimeType: "application/json",
  };
  const model = useMemo(
    () =>
      genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig }),
    []
  );

  // helper: get city
  const getUserCity = async () => {
    try {
      const res = await axios.get("https://ipwhois.app/json/");
      return res.data.city || "Unknown";
    } catch {
      return "Unknown";
    }
  };

  // check hide-once flag
  useEffect(() => {
    const expires = localStorage.getItem(EXPIRE_KEY);
    if (expires && Date.now() < Number(expires)) {
      // still hidden
      return;
    }
    // remove stale
    localStorage.removeItem(EXPIRE_KEY);
    // show initial prompt
    setShowInitial(true);
  }, []);

  // fetch trends after keyword or default
  const fetchTrends = async (search = "general suggestion") => {
    const cityName = await getUserCity();
    setCity(cityName);
    const season = (() => {
      const m = new Date().getMonth() + 1;
      const y = new Date().getFullYear();
      if ([12, 1, 2].includes(m)) return "Winter, " + y;
      if ([3, 4, 5].includes(m)) return "Spring, " + y;
      if ([6, 7, 8].includes(m)) return "Summer, " + y;
      return "Autumn, " + y;
    })();
    const prompt = `You're an AI fashion advisor. In ${cityName} this ${season}, a user is looking for "${search}" (if the user has provided irrelavant search keyword, provide general suggestion). Based on global fashion trends, tell me popular styles, colors, and fabrics. Respond in JSON:\n{ \"season\": \"${season}\", \"styles\": [...], \"fabrics\": [...], \"suggestion\": \"...\" }`;
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = JSON.parse(text);
      setTrendData(data);
      setIsVisible(true);
    } catch (err) {
      console.error("Error fetching trends:", err);
    }
  };

  // handle submit of initial input
  const handleSearch = () => {
    setShowInitial(false);
    fetchTrends(keyword);
  };

  // handle dont show again
  const handleDontShow = () => {
    const expireAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    localStorage.setItem(EXPIRE_KEY, expireAt.toString());
    setShowInitial(false);
  };

  // auto close timer
  useEffect(() => {
    if (isVisible) {
      timerRef.current = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(timerRef.current);
    }
  }, [isVisible]);

  const pauseTimer = () => clearTimeout(timerRef.current);
  const resumeTimer = () => {
    timerRef.current = setTimeout(() => setIsVisible(false), 7000);
  };

  return (
    <>
      <AnimatePresence>
        {showInitial && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-4 bg-white shadow-lg p-4 rounded-2xl w-[330px] z-50 ${theme.mainTheme}`}
          >
            <h2 className="text-lg font-medium mb-2">
              Tell us what you&rsquo;re looking for:
            </h2>
            <button
              onClick={() => setShowInitial(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-2xl"
            >
              ×
            </button>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className={`${inputStyles}`}
              placeholder="Leave empty for General suggestion"
            />
            <div className="flex justify-between items-center">
              <SimpleButton
                btnText={keyword ? "Suggest" : "General Suggestion"}
                onClick={handleSearch}
                type={"primary"}
                extraclasses="mt-3"
              />
              <button
                onClick={handleDontShow}
                className="text-sm text-gray-500 underline"
              >
                Don&apos;t show again
              </button>
            </div>
          </motion.div>
        )}

        {isVisible && trendData && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.6, type: "spring" }}
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
            className={`fixed top-6 right-4 bg-white shadow-lg p-4 rounded-2xl w-[300px] ${theme.mainTheme} z-50`}
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-2xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-2">🌍 Trends in {city}</h2>
            <p className="text-sm mb-1">
              <strong>Season:</strong> {trendData.season}
            </p>
            <p className="text-sm mb-1">
              <strong>Styles:</strong> {trendData.styles.join(", ")}
            </p>
            <p className="text-sm mb-1">
              <strong>Fabrics:</strong> {trendData.fabrics.join(", ")}
            </p>
            <p className={`text-sm ${theme.iconColor} mt-2 italic`}>
              {trendData.suggestion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TrendPop;
