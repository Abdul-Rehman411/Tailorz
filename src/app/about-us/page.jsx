"use client";
import { useContext } from "react";
import { motion } from "framer-motion";
import UserContext from "@/utils/UserContext";
import Image from "next/image";
import Footer from "@/components/Footer";

const AboutUs = () => {
  const { theme } = useContext(UserContext);

  // Framer Motion variants for animation
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

  const cardVariants = {
    offscreen: {
      y: 100,
      opacity: 0,
    },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        bounce: 0.4,
        duration: 0.8,
      },
    },
  };

  const sections = [
    {
      title: "What We Offer",
      icon: "gift",
      items: [
        "Convenient online tailoring solutions",
        "Personalized recommendations and services",
        "Accurate measurements with 3D visualization tools",
        "Enhanced communication and transparency",
        "Streamlined processes for tailors and customers",
      ],
    },
    {
      title: "Our Achievements",
      icon: "trophy",
      items: [
        "Over 1M satisfied users worldwide",
        "Connected hundreds of tailors with loyal customers",
        "97% positive feedback from our user base",
        "Thousands of customized garments delivered",
        "Recognized as a leading innovator in online tailoring",
      ],
    },
    {
      title: "Why Choose Us",
      icon: "heart",
      items: [
        "Unmatched personal and account security",
        "Seamless and secure payment methods",
        "Dedicated support team ensuring satisfaction",
        "Transparent processes with real-time tracking",
        "Empowering tailors with efficient business tools",
      ],
    },
  ];

  const teamMembers = [
    {
      name: "Ahmed Zahid",
      role: "Team Lead / Project Manager",
      email: "zahidahmad440@gmail.com",
      image: "/team_data/zahid.jpg",
      quote: "Passion drives perfection.",
    },
    {
      name: "Syed Ali Abbas Naqvi",
      role: "Co-Founder / Designer",
      email: "developwithaliabbas@gmail.com",
      image: "/team_data/ali.jpg",
      quote: "Design is intelligence made visible.",
    },
    {
      name: "Abdul Rehman",
      role: "Documenter / Internal System Designer",
      email: "abdulrehman4070411@gmail.com",
      image: "/team_data/abdul_rehman.jpg",
      quote: "Precision in documentation leads to excellence.",
    },
  ];

  return (
    <div className={`${theme.mainTheme} h-full w-full overflow-auto`}>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 px-4 md:px-16 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
          >
            About TailorEase
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="text-xl md:text-2xl leading-relaxed"
          >
            Where Tradition Meets Innovation in Tailoring
          </motion.p>
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-16 px-4 md:px-16 max-w-6xl mx-auto"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <i className="fas fa-bullseye text-4xl text-blue-500 mb-4"></i>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg md:text-xl leading-relaxed max-w-4xl mx-auto">
            To transform traditional tailoring by merging advanced tools with
            customer-centric services. TailorEase empowers you to explore,
            customize, and visualize outfits with unmatched ease while giving
            tailors the platform to thrive in a modern, connected world.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.3 }}
              className={`${theme.colorBg} p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300`}
            >
              <div className="text-center mb-6">
                <i
                  className={`fas fa-${section.icon} text-4xl mb-4 text-blue-500`}
                ></i>
                <h3 className="text-2xl font-bold mb-4">{section.title}</h3>
              </div>
              <ul className="space-y-4">
                {section.items.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start"
                  >
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Team Section */}
      <section className="py-16 px-4 md:px-16 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <i className="fas fa-users text-4xl text-purple-500 mb-4"></i>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg max-w-2xl mx-auto">
              The brilliant minds behind TailorEase&apos;s success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.2, type: "spring" }}
                viewport={{ once: true }}
                className={`${theme.colorBg} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-2xl font-bold text-white">
                      {member.name}
                    </h3>
                    <p className="text-blue-200">{member.role}</p>
                  </div>
                </div>
                <div className="p-6">
                  {member.quote && (
                    <blockquote className="italic text-gray-600 dark:text-gray-300 mb-4">
                      &quot;{member.quote}&quot;
                    </blockquote>
                  )}
                  <div className="flex items-center mt-4">
                    <i className="fas fa-envelope mr-2 text-blue-500"></i>
                    <a
                      href={`mailto:${member.email}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {member.email}
                    </a>
                  </div>
                  <div className="flex space-x-4 mt-4">
                    <a href="#" className="text-blue-500 hover:text-blue-700">
                      <i className="fab fa-linkedin text-xl"></i>
                    </a>
                    <a href="#" className="text-blue-400 hover:text-blue-600">
                      <i className="fab fa-twitter text-xl"></i>
                    </a>
                    <a href="#" className="text-gray-600 hover:text-gray-800">
                      <i className="fab fa-github text-xl"></i>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 md:px-16 text-center"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 md:p-12 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Tailoring Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers and tailors who are already
            revolutionizing their craft with TailorEase.
          </p>
          <motion.a
            href="/contact-us"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Now <i className="fas fa-arrow-right ml-2"></i>
          </motion.a>
        </div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;
