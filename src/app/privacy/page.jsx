"use client";

import { useContext } from "react";
import { motion } from "framer-motion";
import UserContext from "@/utils/UserContext";

export default function PrivacyPolicy() {
  const { theme } = useContext(UserContext);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" },
    }),
  };

  const sections = [
    {
      title: "Information We Collect",
      content: [
        "Personal details: name, email, contact number provided during registration.",
        "Order data: measurements, customization preferences, transaction history.",
        "Usage data: pages visited, 3D try-on interactions, and browsing behavior.",
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        "To process orders, facilitate tailor communication, and provide 3D visualization.",
        "To send transactional notifications, updates, and support messages.",
        "To improve our services through analytics and user feedback.",
      ],
    },
    {
      title: "Data Sharing & Disclosure",
      content: [
        "We share your data with tailors only as needed to fulfill your orders.",
        "We never sell personal information to third parties or advertisers.",
        "Service providers (e.g., payment processors) may process data under strict confidentiality.",
      ],
    },
    {
      title: "Cookies & Tracking",
      content: [
        "We use cookies to maintain session state and remember preferences.",
        "Analytics cookies help us understand platform usage and improve features.",
        "Users can disable non-essential cookies via browser settings, but core functionality may be affected.",
      ],
    },
    {
      title: "Security Measures",
      content: [
        "Your data is protected using Firebase Authentication and secure Firestore rules.",
        "We implement HTTPS, encryption at rest, and regular security audits.",
        "Access to sensitive data is restricted to authorized personnel only.",
      ],
    },
    {
      title: "Your Rights",
      content: [
        "Access: You can view and download your personal data anytime from your account.",
        "Correction: You may update or correct your information in account settings.",
        "Deletion: You can request account deletion; residual data may remain for legal compliance.",
      ],
    },
    {
      title: "Policy Updates",
      content: [
        "We may update this policy; changes will be noted with a new 'Last updated' date.",
        "Notification of major changes will be sent via email or platform notification.",
      ],
    },
  ];

  return (
    <div
      className={`${theme.mainTheme} max-w-[99.5%] mx-auto my-3 md:my-1 h-full overflow-y-auto py-8 px-4 md:px-16 rounded-lg`}
    >
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className={`text-md ${theme.subTextColor}`}>
          Your privacy is important to us. This policy explains how we handle
          your data.
        </p>
      </header>

      <div className="space-y-12">
        {sections.map((section, idx) => (
          <motion.section
            key={idx}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={idx}
            variants={sectionVariants}
            className={`${theme.colorBg} p-6 rounded-xl border ${theme.colorBorder}`}
          >
            <h2 className={`text-2xl font-semibold mb-4 ${theme.colorText}`}>
              {section.title}
            </h2>
            <ul className="list-disc list-inside space-y-2">
              {section.content.map((line, i) => (
                <li key={i} className={`text-sm ${theme.subTextColor}`}>
                  {line}
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>

      <footer className="text-center mt-12">
        <p className={`text-sm ${theme.subTextColor}`}>
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
}
