"use client";
import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import UserContext from "@/utils/UserContext";
import SimpleButton from "@/components/SimpleButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ContactUs = () => {
  const {
    theme,
    setShowMessage,
    setPopUpMessageTrigger,
    userData,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: userData?.fullName ? userData.fullName : "",
    email: userData?.email ? userData.email : "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setShowMessage({ type: "warning", message: "Please enter your name" });
      setPopUpMessageTrigger(true);
      return;
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setShowMessage({
        type: "warning",
        message: "Provide a valid email",
      });
      setPopUpMessageTrigger(true);
      return;
    }
    if (!formData.message.trim()) {
      setShowMessage({
        type: "warning",
        message: "Please write a message",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setTimeout(() => {
        setShowMessage({
          type: "success",
          message: "Message sent successfully!",
        });
        setPopUpMessageTrigger(true);
        console.log(formData);
        setFormData({ name: "", email: "", message: "" });
      }, 1000);
    } catch (error) {
      setShowMessage({
        type: "danger",
        message: "Failed to send the message.",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[99.5%] mx-auto my-4 md:my-1 h-full overflow-y-auto flex-grow rounded-lg"
    >
      <div className="flex flex-col h-full rounded-xl md:flex-row">
        {/* Left Section */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className={`w-full md:w-1/2 p-8 ${theme.mainTheme} flex flex-col items-start border-b md:border-b-0 md:border-r ${theme.colorBorder} rounded-t-xl md:rounded-tr-none md:rounded-l-xl`}
        >
          <div className="mb-8">
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600`}
            >
              Get in Touch
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`${theme.colorText} mb-8 text-lg leading-relaxed`}
            >
              Have questions or need assistance? Fill out the form, and
              we&apos;ll get back to you as soon as possible. You can also reach
              us via email or phone for immediate support.
            </motion.p>
          </div>

          <motion.ul
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`${theme.colorText} space-y-6 mb-8 w-full`}
          >
            <motion.li variants={itemVariants} className="flex items-start">
              <div className="bg-blue-700 px-3 py-2 rounded-full mr-4">
                <i className="fas fa-envelope text-blue-400 text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Email</h3>
                <a
                  href="mailto:support@tailorease.com"
                  className="hover:text-blue-600 transition-colors"
                >
                  support@tailorease.com
                </a>
              </div>
            </motion.li>

            <motion.li variants={itemVariants} className="flex items-start">
              <div className="bg-green-700 px-3 py-2 rounded-full mr-4">
                <i className="fab fa-whatsapp text-green-400 text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">WhatsApp</h3>
                <a
                  href="https://wa.me/923108646268"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-600 transition-colors"
                >
                  +92 (310) 8646268
                </a>
              </div>
            </motion.li>

            <motion.li variants={itemVariants} className="flex items-start">
              <div className="bg-purple-700 px-3 py-2 rounded-full mr-4">
                <i className="fas fa-map-marker-alt text-purple-400 text-xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg">Address</h3>
                <p>
                  3rd Floor, Ufone Tower, Office No. 248, Islamabad, Pakistan
                </p>
              </div>
            </motion.li>
          </motion.ul>

          {/* Social Media Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex space-x-6 mt-auto"
          >
            <motion.a
              whileHover={{ y: -5 }}
              href="https://www.facebook.com/profile.php?id=61575302895431"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-blue-600 hover:text-blue-800 transition-colors"
            >
              <i className="fab fa-facebook-f"></i>
            </motion.a>
            <motion.a
              whileHover={{ y: -5 }}
              href="https://www.twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-blue-400 hover:text-blue-600 transition-colors"
            >
              <i className="fab fa-twitter"></i>
            </motion.a>
            <motion.a
              whileHover={{ y: -5 }}
              href="https://www.linkedin.com/company/107202971"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-blue-700 hover:text-blue-900 transition-colors"
            >
              <i className="fab fa-linkedin-in"></i>
            </motion.a>
            <motion.a
              whileHover={{ y: -5 }}
              href="https://youtube.com/@tailoreaseplatform?si=pXMDwaLdXmXtQkri"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl text-red-600 hover:text-red-800 transition-colors"
            >
              <i className="fab fa-youtube"></i>
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Right Section (Form) */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className={`w-full md:w-1/2 p-8 rounded-b-xl md:rounded-bl-none md:rounded-r-xl ${theme.mainTheme}`}
        >
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600`}
          >
            Send Us a Message
          </motion.h2>

          <motion.form
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mb-8"
            >
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputStyles} peer`}
                placeholder=" "
              />
              <label className={`${placeHolderStyles}`} htmlFor="name">
                Your Name
              </label>
              <i className="fas fa-user absolute right-4 top-4 text-gray-400 peer-focus:text-blue-500"></i>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative mb-8"
            >
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${inputStyles} peer`}
                placeholder=" "
              />
              <label className={`${placeHolderStyles}`} htmlFor="email">
                Email Address
              </label>
              <i className="fas fa-envelope absolute right-4 top-4 text-gray-400 peer-focus:text-blue-500"></i>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="relative mb-8"
            >
              <textarea
                maxLength={500}
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`${inputStyles} h-40 resize-none peer`}
                placeholder=" "
              />
              <label className={`${placeHolderStyles}`} htmlFor="message">
                Your Message
              </label>
              <i className="fas fa-comment-dots absolute right-4 top-4 text-gray-400 peer-focus:text-blue-500"></i>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <SimpleButton
                btnText={
                  isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size={24} />
                      <span className="ml-2">Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <i className="fas fa-paper-plane mr-2"></i>
                      Send Message
                    </div>
                  )
                }
                type="primary-submit"
                extraclasses={"w-full py-4 text-lg"}
                disabled={isSubmitting}
              />
            </motion.div>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ContactUs;
