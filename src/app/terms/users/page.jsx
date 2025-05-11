"use client";

import { useContext } from "react";
import { motion } from "framer-motion";
import UserContext from "@/utils/UserContext";

export default function TermsAndConditions() {
  const { theme } = useContext(UserContext);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
  };

  const sections = [
    {
      title: "Eligibility & Account Responsibility",
      content: [
        "Users must be at least 10 years old to use TailorEase.",
        "You are responsible for all activities under your account. Do not share login credentials or impersonate others.",
      ],
    },
    {
      title: "Service Use & Responsibility",
      content: [
        "Ensure all information you provide during orders—like measurements, design details, and timelines—is accurate.",
        "TailorEase is not liable for issues caused by incorrect user inputs or incomplete order details.",
      ],
    },
    {
      title: "Communication & Conduct",
      content: [
        "All communication with tailors must remain respectful and professional.",
        "Do not request or offer services outside of the platform. Violations may result in suspension.",
      ],
    },
    {
      title: "Payments & Refunds",
      content: [
        "Payments must be made through TailorEase's secure system.",
        "Refunds are subject to our refund policy and issued after a thorough review of the dispute.",
      ],
    },
    {
      title: "Content & Behavior Restrictions",
      content: [
        "Do not use TailorEase to post or transmit illegal, abusive, or misleading content.",
        "Spamming, scamming, or disrupting the platform in any way will lead to permanent bans and potential legal action.",
      ],
    },
    {
      title: "Reviews & Feedback",
      content: [
        "You’re encouraged to leave honest feedback, but it must remain respectful and not defamatory.",
        "TailorEase reserves the right to remove any review that violates our guidelines.",
      ],
    },
    {
      title: "Platform Changes & Termination",
      content: [
        "We may change, suspend, or discontinue any part of the service at any time.",
        "TailorEase may suspend or terminate accounts that violate these terms or compromise user safety.",
      ],
    },
    {
      title: "Agreement",
      content: [
        "By using TailorEase, you agree to these terms and our Privacy Policy.",
        "Using the service after updates to terms means you accept the revised conditions.",
      ],
    },
  ];

  return (
    <div
      className={`${theme.mainTheme} max-w-[99.5%] mx-auto my-3 md:my-1 h-full overflow-y-auto py-8 px-4 md:px-16 rounded-lg`}
    >
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Terms & Conditions For End-Users
        </h1>
        <p className={`text-md ${theme.subTextColor}`}>
          Applicable to all TailorEase accounts.
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
        <div className="inline">
          <span>Read terms for </span>
          <a href="/terms/tailors" className="text-blue-600">
            Tailors
          </a>
        </div>
      </footer>
    </div>
  );
}
