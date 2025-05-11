"use client";
import React, { useContext } from "react";
import { motion } from "framer-motion";
import UserContext from "@/utils/UserContext";
import SimpleButton from "@/components/SimpleButton";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function Home() {
  const { theme } = useContext(UserContext);
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
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

  const features = [
    {
      title: "Tailor/Customer Focus",
      description:
        "Personalized experiences tailored to meet unique needs of both tailors and customers.",
      icon: "user-tie",
      bg: "bg-blue-300 dark:bg-blue-700",
      iconColor: "text-blue-700 dark:text-blue-400",
      link: "/tailors",
    },
    {
      title: "24/7 AI Chatbot Support",
      description:
        "Get assistance anytime with our advanced AI chatbot, always ready to help.",
      icon: "robot",
      bg: "bg-purple-300 dark:bg-purple-700",
      iconColor: "text-purple-700 dark:text-purple-400",
      link: "",
    },
    {
      title: "Customizable Products",
      description:
        "Choose from wide designs and customize products to suit your style.",
      icon: "palette",
      bg: "bg-amber-300 dark:bg-amber-700",
      iconColor: "text-amber-700 dark:text-amber-400",
      link: "/market",
    },
    {
      title: "Free Virtual Try-On",
      description: "Experience realistic virtual try-on for your convenience.",
      icon: "vr-cardboard",
      bg: "bg-emerald-300 dark:bg-emerald-700",
      iconColor: "text-emerald-700 dark:text-emerald-400",
      link: "/outfit-customization?outfit=jacket,pants",
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Section */}
      <div
        className={`relative overflow-hidden max-w-[99.5%] mx-auto flex items-center justify-center w-auto rounded-t-lg select-none`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600/30 to-pink-500/30"></div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-blue-500 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-purple-500/30 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="space-y-8"
            >
              <motion.h1
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold"
              >
                Revolutionizing <br /> Tailoring Experience
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="text-xl md:text-2xl text-gray-700 dark:text-gray-300"
              >
                Where AI meets craftsmanship to deliver perfect fits every time
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/market">
                  <SimpleButton
                    btnText={
                      <div className="flex items-center">
                        Explore Marketplace{" "}
                        <i className="fas fa-arrow-right ml-3 transition-transform group-hover:translate-x-1"></i>
                      </div>
                    }
                    type={"accent"}
                    extraclasses="px-8 py-4 text-lg"
                  />
                </Link>
                <Link href="/tailors">
                  <SimpleButton
                    btnText={
                      <div className="flex items-center">
                        Find Tailors{" "}
                        <i className="fas fa-user-tie ml-3 transition-transform group-hover:translate-x-1"></i>
                      </div>
                    }
                    extraclasses="px-8 py-4 text-lg"
                  />
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-6 pt-4"
              >
                <div className="flex items-center">
                  <i className="fas fa-users text-blue-600 text-xl mr-2"></i>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Connecting clients and tailors
                  </span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-check-circle text-green-500 text-xl mr-2"></i>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Safe transactions and delivery
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - 3D Model Showcase */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="relative"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Main product showcase */}
                <div
                  className={`absolute inset-0 rounded-[40px] bg-gradient-to-br from-blue-500 to-purple-600/30 shadow-2xl backdrop-blur-sm border ${theme.colorBorder}`}
                ></div>
                <div
                  className={`absolute inset-8 rounded-3xl overflow-hidden border-8 ${theme.colorBorder} shadow-xl`}
                >
                  <Image
                    src="/images/assets/hero-model.png"
                    alt="TailorEase Platform"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    priority
                  />
                </div>

                {/* Floating 3D try-on badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="absolute -bottom-6 -right-6 w-28 h-28 rounded-2xl bg-gray-800 shadow-lg p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  whileHover={{ y: -8 }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/assets/3d-tryon.png"
                      alt="3D Try-On"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      priority
                    />
                    <div
                      className="absolute inset-0 flex items-end justify-center pb-2"
                      onClick={() =>
                        router.push(
                          "/outfit-customization?outfit=kameezShalwar"
                        )
                      }
                    >
                      <span className="text-xs font-medium bg-gray-800 text-white border px-2 py-1 rounded-full">
                        <i className="fas fa-vr-cardboard mr-1"></i> Try It!
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Satisfaction badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-gray-800 shadow-lg flex items-center justify-center border border-gray-200"
                  whileHover={{ rotate: 360 }}
                >
                  <div className="text-center p-4">
                    <div className="text-4xl font-bold text-blue-600">97%</div>
                    <div className="text-sm font-medium text-gray-300">
                      <i className="fas fa-thumbs-up mr-1"></i> Satisfaction
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section
        className={` ${theme.mainTheme} py-20 px-6 max-w-[99.5%] mx-auto flex items-center justify-center w-auto select-none`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose TailorEase
            </h2>
            <p className="text-xl max-w-3xl mx-auto">
              The perfect blend of technology and traditional craftsmanship
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`${theme.mainTheme} p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 group`}
                whileHover={{ y: -10 }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${feature.bg} ${feature.iconColor} flex items-center justify-center mb-6 text-2xl group-hover:rotate-6 transition-transform`}
                >
                  <i className={`fas fa-${feature.icon}`}></i>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className={`${theme.colorText}`}>{feature.description}</p>
                <div className="mt-4 pt-4 border-t">
                  <Link
                    href={feature.link}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    Learn more{" "}
                    <i className="fas fa-arrow-right ml-2 text-xs"></i>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: "50,000+", label: "Happy Customers", icon: "users" },
              { value: "97%", label: "Satisfaction Rate", icon: "thumbs-up" },
              { value: "8,500+", label: "Expert Tailors", icon: "user-tie" },
              { value: "24/7", label: "Live Support", icon: "headset" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-2xl ${
                  index % 2 === 0
                    ? "bg-blue-50 dark:bg-blue-900"
                    : "bg-purple-50 dark:bg-purple-900/60"
                } text-center`}
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300 flex items-center justify-center">
                  <i className={`fas fa-${stat.icon} mr-2 text-blue-500`}></i>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600/40 to-gray-600/50 text-white relative overflow-hidden max-w-[99.6%] mx-auto flex items-center justify-center w-auto select-none`}
      >
        {/* Floating elements */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-white/10 blur-xl"></div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Ready to Transform Your Tailoring Experience?
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl mb-8"
          >
            Join thousands of satisfied customers and tailors who are already
            revolutionizing their craft with TailorEase.
          </motion.p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/market">
              <SimpleButton
                btnText={
                  <div className="flex items-center justify-center group-hover:text-blue-600">
                    Explore Marketplace{" "}
                    <i className="fas fa-store ml-3 transition-transform group-hover:translate-x-1"></i>
                  </div>
                }
                type={"accent"}
                extraclasses="px-8 py-4 text-lg border"
              />
            </Link>
            <Link href="/tailors">
              <SimpleButton
                btnText={
                  <div className="flex items-center justify-center">
                    Find Tailors{" "}
                    <i className="fas fa-user-tie ml-3 transition-transform group-hover:translate-x-1"></i>
                  </div>
                }
                extraclasses="px-8 py-4 text-lg"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
