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
        "You must be a registered business on TailorEase to access these terms.",
        "Maintain the confidentiality of your account credentials.",
        "You agree to provide accurate and current business information.",
      ],
    },
    {
      title: "Service Use & Listings",
      content: [
        "Tailors may list custom tailoring products and set pricing, delivery times, and return policies.",
        "Ensure all product descriptions and images are truthful and not misleading.",
        "TailorEase reserves the right to remove any content that violates our policies.",
      ],
    },
    {
      title: "Order Fulfillment & Quality",
      content: [
        "You commit to fulfilling orders in the time frame stated in your business dashboard.",
        "Maintain high workmanship standards on all garments and customizations.",
        "Handle customer disputes in good faith and coordinate with TailorEase support when needed.",
      ],
    },
    {
      title: "Fees & Payments",
      content: [
        "Platform fees or commissions are as outlined under Business Pricing.",
        "Payments are processed securely via our integrated gateway; funds are disbursed after order completion.",
        "Late or disputed payments may incur additional review.",
      ],
    },
    {
      title: "Suspension & Termination",
      content: [
        "Violations of these terms may lead to account suspension or removal.",
        "You may cancel your business account at any time via Business Settings.",
        "Upon termination, listings will be removed but historical order data remains available for compliance.",
      ],
    },
  ];

  return (
    <div
      className={`${theme.mainTheme} max-w-[99.5%] mx-auto my-3 md:my-1 h-full overflow-y-auto py-8 px-4 md:px-16 rounded-lg`}
    >
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Terms & Conditions For Business
        </h1>
        <p className={`text-md ${theme.subTextColor}`}>
          Applicable to all TailorEase tailors and business accounts.
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

      <footer className={`text-center mt-12 ${theme.subTextColor}`}>
        <p className="text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        <div className="inline">
          <span>Read terms for </span>
          <a href="/terms/users" className="text-blue-600">
            Users
          </a>
        </div>
      </footer>
    </div>
  );
}
