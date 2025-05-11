"use client";

import React, { useState, useEffect, useRef, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SyncLoader } from "react-spinners";
import UserContext from "@/utils/UserContext";
import { ShiftingBounceLoader } from "./LoadingSpinner";
import { marked } from "marked";
import { Filter } from "bad-words";
import { db } from "@/utils/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const ChatBot = () => {
  const { theme, userData, userLoggedIn } = useContext(UserContext);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi, how can I help you with your TailorEase experience today!?",
      sender: "model",
      isHTML: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [botQuery, setBotQuery] = useState(false);

  const { GoogleGenerativeAI } = require("@google/generative-ai");

  // Initialize the Generative AI Client
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: !botQuery
      ? `You're an AI assistant for the website TailorEase.
  
    If the user is inquiring about orders or order status then respond only with "order status requested". The system will take this in string format and work with it. Don't ask the user for further information.
  
    Otherwise, here’s the information about TailorEase:
  
    General/About TailorEase:
    TailorEase is a platform that modernizes the tailoring experience. We help customers find skilled tailors, customize outfits online, visualize clothing with 3D try-ons, and easily communicate and manage orders — all in one place.
  
    Theme Settings:
    In user settings, you can choose from different themes:
    • Midnight Whisper (dark gray)
    • Lunar Glow (vibrant white)
    • Neon Punk (flashy neon)
  
    User Registration:
    Sign up at TailorEase Signup with a valid email and a password (minimum 6 characters). The process takes less than 60 seconds.
  
    Becoming a Tailor / Business Registration:
    Visit Become a Tailor, fill out your business details, and select specialties (e.g., Men's, Kids'). Confirm your email to activate your business dashboard.
  
    Business Dashboard Features:
    • Add and manage products and services.
    • Set customizations, prices, delivery charges/times, return policies.
    • Write a business description and FAQs.
    • Manage business settings and visibility.
  
    Market/Products:
    Browse tailor-offered products and services. Apply filters based on:
    • Specialties (e.g., Men’s, Kids’)
    • Open/Close timings
    • Pricing
    • Customizations
    • Location
  
    Outfit Customization:
    After selecting an outfit that supports 3D viewing, users can customize:
    • Size, color, texture
    • Button style/color
    • Collar design
    • Sleeve design
    • Add custom touches
    3D virtual try-on helps users visualize the final look realistically.
  
    Notifications:
    Users receive real-time notifications for orders, messages, and updates. Notifications are managed from a floating button with a badge counter.
  
    Tailors:
    Tailors are verified businesses providing services through TailorEase. Users can view tailor profiles, ratings, policies, addresses, work hours, and delivery options.
  
    Tailor Ratings & Reviews:
    Users can leave a rating (1 to 5 stars) and a review after completing an order. Sentiment analysis highlights top-rated tailors.
  
    Account Security:
    Accounts are protected by Firebase Authentication (Google) with high security standards. User data remains private except necessary public info (e.g., tailor profile).
  
    Managing Orders:
    Users can reschedule or cancel orders from "My Orders". Tailors may have individual cancellation/rescheduling policies.
  
    Business Account Pricing:
    Tailors may be required to pay a subscription or commission fee. Details are available under Business Pricing.
  
    If Unsatisfied With a Tailor:
    Users can leave reviews and contact support to open disputes if needed. Support ensures fair resolution.
  
    Disabled Accounts:
    • User Account Disabled: Usually for violation of terms. Check email for instructions to appeal.
    • Business Account Disabled: Happens if the business violates terms. Tailor profiles are hidden but can be restored after resolving the issue.
  
    Support/Contact Information:
    • Email: support@tailorease.com
    • WhatsApp: +92 (310) 8646268
    • Address: Office 248, 3rd Floor, Ufone Tower, Islamabad, Pakistan.
  
    WARNING: Only reply based on the above provided information. Avoid inventing or assuming details beyond the given scope to comply with TailorEase and Google policies.`
      : "The user has asked for information that needed to be fetched from the database. Here is the data fetched from the database. Summarize the information in the following stringified object for the user in natural language.",
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 5500,
    responseMimeType: "text/plain",
  };

  const [isHistoryFetched, setIsHistoryFetched] = useState(false);

  // Load chat history if available for the logged-in user
  useEffect(() => {
    if (userLoggedIn && userData?.uid) {
      const savedChatHistory = localStorage.getItem(
        `chatHistory.${userData.uid}`
      );
      if (savedChatHistory) {
        setMessages(JSON.parse(savedChatHistory)); // Set chat history if found
      }
      setIsHistoryFetched(true); // Mark history as fetched
    } else {
      setIsHistoryFetched(true); // Even if no user is logged in, mark history as fetched
    }
    if (!userLoggedIn) {
      setMessages([
        {
          text: "Hi, how can I help you with your TailorEase experience today!?",
          sender: "model",
          isHTML: true,
        },
      ]);
    }
  }, [userLoggedIn, userData?.uid]); // This runs when login status or userData changes

  const buildHistory = () => {
    const reversed = messages.slice().reverse();

    const lastUserMessage = reversed.find((msg) => msg.sender === "user");
    const lastModelMessage = reversed.find((msg) => msg.sender === "model");

    const history = [];

    if (lastUserMessage) {
      history.push({
        role: "user",
        parts: [{ text: lastUserMessage.text }],
      });
    }

    if (lastModelMessage && history.length > 0) {
      history.push({
        role: "model",
        parts: [{ text: lastModelMessage.text }],
      });
    }
    if (!lastUserMessage) return [];

    return history;
  };

  async function generateResponse(userInput) {
    const chatSession = model.startChat({
      generationConfig,
      history: buildHistory(), // history is optional. It costs tokens but improves the generated response
    });

    const result = await chatSession.sendMessage(userInput);
    return result.response.text();
  }

  const detector = new Filter();

  // Save chat history to localStorage only after history is fetched and messages state is updated
  useEffect(() => {
    if (userLoggedIn && userData?.uid && isHistoryFetched) {
      // Only save messages to localStorage once history has been fetched
      localStorage.setItem(
        `chatHistory.${userData.uid}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, userLoggedIn, userData?.uid, isHistoryFetched]);

  const handleSendMessage = async (querySnapshot) => {
    if (!input.trim() && !querySnapshot) {
      return;
    }
    if (querySnapshot) {
      setBotQuery(false);
    }

    if (detector.isProfane(input)) {
      const systemMessage = {
        text: "Warning! Your message contains explicit language. Refrain from this behavior or you'll be suspended",
        sender: "system",
      };
      setMessages((prev) => [...prev, systemMessage]);
      setInput("");
      return;
    }

    if (input.trim()) {
      const userMessage = { text: input, sender: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    }

    setIsTyping(true);
    const botResponse = await generateResponse(
      querySnapshot ? querySnapshot : input
    );
    setIsTyping(false);
    if (botResponse.includes("order status requested")) {
      setBotQuery(true);
      return;
    }
    const formattedText = marked.parse(botResponse);
    setMessages((prev) => [
      ...prev,
      { text: formattedText, sender: "model", isHTML: true },
    ]);
  };

  const handleClickOutside = (e) => {
    if (chatBoxRef.current && !chatBoxRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      setTimeout(() => {
        scrollToBottom(); // Scroll when chat opens
      }, 350); // timeout to allow the messagesEndRef to be set before scrolling
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchData = async () => {
      if (!botQuery) return;
      if (!userLoggedIn) {
        handleSendMessage(
          "The user is not logged in, inform the user to log in to see your orders"
        );
        return;
      }

      try {
        setBotQuery(false);
        const botMessage = {
          text: "Please wait while we fetch that information for you...",
          sender: "model",
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(true);

        const ordersCollection = collection(db, "OrdersManagement");

        const ordersQuery = query(
          ordersCollection,
          where("userId", "==", userData?.uid),
          where("orderStatus", "not-in", ["inCart"]) // Firestore likes "not-in" instead of "!=". Can also search for multiple values like ["inCart", "cancelled"]
        );

        const querySnapshot = await getDocs(ordersQuery);

        if (!querySnapshot.empty) {
          const orders = querySnapshot.docs.map((doc) => ({
            orderData: doc.data(),
            orderId: doc.id,
          }));

          handleSendMessage(JSON.stringify(orders)); // Sending ALL orders, not just the first one
        } else {
          handleSendMessage("querySnapshot was empty, inform the user");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        handleSendMessage("Something went wrong while fetching your order.");
      } finally {
        setIsTyping(false);
      }
    };
    fetchData();
  }, [botQuery, userData?.uid]);

  const handleDeleteHistory = () => {
    localStorage.removeItem(`chatHistory.${userData.uid}`);
    setMessages([
      {
        text: "Hi, how can I help you with your TailorEase experience today!?",
        sender: "model",
        isHTML: true,
      },
    ]);
  };

  const chatBoxVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  return (
    <>
      {/* ChatBot Trigger Icon */}
      <div
        className={`fixed bottom-2 sm:bottom-8 right-2 sm:right-8 w-12 h-12 flex items-center justify-center select-none rounded-full border-2 shadow-lg cursor-pointer hover:scale-105 z-[9999] ${theme.mainTheme} ${theme.hoverBg}`}
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? (
          <ShiftingBounceLoader size={42} /> // sort of a thinking animation when the chatbox is open
        ) : (
          <i className={`fas fa-robot text-2xl ${theme.iconColor}`}></i>
        )}
      </div>

      {/* ChatBot Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed bottom-[6rem] right-2 sm:right-8 max-w-full w-[280px] h-[450px] sm:w-[400px] sm:h-[75%] bg-white rounded-lg shadow-lg flex flex-col z-[99999] ${theme.mainTheme} ${theme.colorBorder}`}
            ref={chatBoxRef}
            variants={chatBoxVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* ChatBot Header */}
            <div
              className={`flex items-center justify-between p-4 border-b select-none ${theme.colorBorder}`}
            >
              <div className="flex items-center space-x-2">
                <i className={`fas fa-robot text-4xl ${theme.iconColor}`}></i>
                <div>
                  <h3 className={`text-lg font-bold ${theme.colorText}`}>
                    TE-AI ASSISTANT
                  </h3>
                  <div className="flex">
                    <p className="flex text-sm font-semibold text-green-600">
                      Online
                    </p>
                    {userLoggedIn && (
                      <button
                        className="flex bg-transparent text-sm ml-2 text-gray-600 hover:text-gray-400"
                        onClick={handleDeleteHistory}
                      >
                        Delete history
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <i
                className="fas fa-times cursor-pointer text-xl hover:text-red-500"
                onClick={() => setIsOpen(false)}
              ></i>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "model" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg text-white animated-message ${
                      msg.sender === "user"
                        ? "bg-blue-600"
                        : msg.sender === "model"
                        ? `${theme.mainTheme}`
                        : "bg-rose-500 italic"
                    }`}
                  >
                    {msg.isHTML ? (
                      // Render HTML using dangerouslySetInnerHTML
                      <div
                        dangerouslySetInnerHTML={{
                          __html: msg.text,
                        }}
                      />
                    ) : (
                      // Render plain text
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-lg flex items-center">
                    <SyncLoader
                      size={8}
                      speedMultiplier={0.5}
                      color={`${theme.colorText}`}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Input Box */}
            <div
              className={`flex items-center p-3 border-t ${theme.colorBorder}`}
            >
              <input
                type="text"
                className="flex-1 p-2 rounded-lg bg-gray-100 outline-none text-gray-800"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                autoFocus="true"
              />
              <button
                className="w-10 h-10 flex items-center justify-center ml-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                onClick={handleSendMessage}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
