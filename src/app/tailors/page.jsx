"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { db } from "@/utils/firebaseConfig";
import { collection, getDocs, query } from "firebase/firestore";
import { ClipLoader } from "react-spinners";
import UserContext from "@/utils/UserContext";
import SimpleButton from "@/components/SimpleButton";
import { AnimatePresence, motion } from "framer-motion";
import QuickView from "@/components/QuickView";
import Image from "next/image";

const Tailors = () => {
  const { theme } = useContext(UserContext);

  const specialities = [
    { name: "Men Specialist", icon: "male" },
    { name: "Women Specialist", icon: "female" },
    { name: "Kids Specialist", icon: "child" },
    { name: "Alterations", icon: "cut" },
    { name: "Custom Tailoring", icon: "ruler-combined" },
    { name: "Other", icon: "ellipsis-h" },
  ];

  const sortOptions = [
    { name: "Top Rated", icon: "star" },
    { name: "Most Reviews", icon: "comments" },
    { name: "Newest", icon: "clock" },
  ];

  const [filters, setFilters] = useState({
    sortBy: "Top Rated",
    showCount: 60,
    page: 1,
  });
  const [specialityFilter, setSpecialityFilter] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [tailorList, setTailorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState(null);

  const handleTailorClick = (tailor) => {
    setSelectedTailor(tailor);
    setPopupVisible(true);
  };

  const fetchTailors = async () => {
    setLoading(true);
    try {
      const tailorCollectionRef = collection(db, "tailors");
      let q = query(tailorCollectionRef);

      const querySnapshot = await getDocs(q);

      // Filter out tailors where status is not "active" or approved is false
      let tailors = querySnapshot.docs
        .map((doc) => ({
          id: doc.id, // Document ID
          ...doc.data(), // Document data
        }))
        .filter(
          (tailor) => tailor.status === "active" && tailor.approved === true
        );

      // Apply search filter
      if (searchQuery) {
        tailors = tailors.filter(
          (tailor) =>
            tailor.businessName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            tailor.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (appliedFilters.length > 0) {
        tailors = tailors.filter((tailor) =>
          appliedFilters.every((filter) =>
            tailor.specialities?.includes(filter)
          )
        );
      }

      // Compute global average and minimum reviews for Bayesian method
      const allRatings = tailors.map((tailor) => tailor.rating || 0);
      const globalAverageRating =
        allRatings.length > 0
          ? allRatings.reduce((sum, rating) => sum + rating, 0) /
            allRatings.length
          : 0;

      const minReviews = 10;

      const processedTailors = tailors.map((tailor) => {
        let rating = tailor.rating || 0;
        if (rating < 0) rating = 0;

        const totalRatings = tailor.total_rating || 6;
        const numberOfReviews = totalRatings / 6;

        const normalizedRating = (rating / totalRatings) * 5;

        // Bayesian average ranking score
        const bayesianScore =
          (rating * numberOfReviews + globalAverageRating * minReviews) /
          (numberOfReviews + minReviews);

        return {
          ...tailor,
          normalizedRating,
          bayesianScore,
          numberOfReviews,
        };
      });

      // Apply sorting
      let sortedTailors = [...processedTailors];
      switch (filters.sortBy) {
        case "Most Reviews":
          sortedTailors.sort((a, b) => b.numberOfReviews - a.numberOfReviews);
          break;
        case "Newest":
          sortedTailors.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "Top Rated":
        default:
          sortedTailors.sort((a, b) => {
            if (b.bayesianScore !== a.bayesianScore) {
              return b.bayesianScore - a.bayesianScore;
            }
            return b.normalizedRating - a.normalizedRating;
          });
          break;
      }

      setTailorList(sortedTailors);
    } catch (error) {
      console.error("Error fetching tailors:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTailors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, filters.sortBy, searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !dropdownButtonRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const dropdownVariants = {
    hidden: { scaleY: 0, transformOrigin: "top" },
    visible: { scaleY: 1, transformOrigin: "top" },
    exit: { scaleY: 0, transformOrigin: "top" },
  };

  const tailorVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const toggleDropdown = () => {
    if (!dropdownOpen && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleChange = (value) => {
    setSpecialityFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const applyFilters = () => {
    setAppliedFilters([...specialityFilter]);
    setDropdownOpen(false);
  };

  const clearFilters = () => {
    setSpecialityFilter([]);
    setAppliedFilters([]);
    setSearchQuery("");
  };

  const toggleSearch = () => {
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchQuery("");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i
          key={`full-${i}`}
          className="fas fa-star text-yellow-400 text-sm"
        ></i>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <i
          key="half"
          className="fas fa-star-half-alt text-yellow-400 text-sm"
        ></i>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i key={`empty-${i}`} className="far fa-star text-gray-400 text-sm"></i>
      );
    }

    return stars;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className={`max-w-[99.5%] mx-auto my-4 md:my-1 h-full select-none`}>
        <div className={`p-4 ${theme.mainTheme} rounded-lg`}>
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-2xl font-bold ${theme.colorText} ${
                searchActive ? "hidden md:block" : "block"
              }
                `}
            >
              All Tailors
            </h2>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div
                className={`relative transition-all duration-300 ${
                  searchActive ? "w-64" : "w-10"
                }`}
              >
                {searchActive ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center"
                  >
                    <i
                      className={`fas fa-search absolute left-3 ${theme.iconColor} opacity-70`}
                    ></i>
                    <input
                      type="text"
                      placeholder="Search tailors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full p-2 pl-10 pr-8 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <i
                      className={`fas fa-times absolute right-3 cursor-pointer ${theme.iconColor} hover:text-red-500`}
                      onClick={toggleSearch}
                    ></i>
                  </motion.div>
                ) : (
                  <i
                    className={`fas fa-search cursor-pointer ${theme.iconColor} ${theme.hoverText} text-xl`}
                    onClick={toggleSearch}
                  ></i>
                )}
              </div>

              {/* Filter Button */}
              <div className="relative" ref={dropdownButtonRef}>
                <SimpleButton
                  type={"default"}
                  btnText={
                    <>
                      <i className="fas fa-filter mr-2"></i>
                      Filters
                    </>
                  }
                  extraclasses={`px-4 py-2 border font-semibold ${theme.colorBorder}`}
                  onClick={toggleDropdown}
                />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(appliedFilters.length > 0 || searchQuery) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mb-4"
            >
              <span className={`text-sm ${theme.colorText}`}>
                <i className="fas fa-filter mr-1"></i>
                Active filters:
              </span>
              {appliedFilters.map((filter) => (
                <motion.span
                  key={filter}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-3 py-1 text-xs rounded-full ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} flex items-center`}
                >
                  <i
                    className={`fas fa-${
                      specialities.find((s) => s.name === filter)?.icon || "tag"
                    } mr-1`}
                  ></i>
                  {filter}
                </motion.span>
              ))}
              {searchQuery && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-3 py-1 text-xs rounded-full ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} flex items-center`}
                >
                  <i className="fas fa-search mr-1"></i>
                  Search: {searchQuery}
                </motion.span>
              )}
              <button
                onClick={clearFilters}
                className={`ml-2 text-xs underline ${theme.colorText} hover:text-blue-500 flex items-center`}
              >
                <i className="fas fa-broom mr-1"></i>
                Clear all
              </button>
            </motion.div>
          )}

          {/* Sort Options */}
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            {sortOptions.map((option) => (
              <motion.button
                key={option.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ ...filters, sortBy: option.name })}
                className={`px-2 m-2 py-2 rounded-full text-sm whitespace-nowrap flex items-center ${
                  filters.sortBy === option.name
                    ? `${theme.hoverBg} bg-opacity-50 font-bold`
                    : `${theme.colorBg}`
                } ${theme.colorText} border ${theme.colorBorder}`}
              >
                <i
                  className={`fas fa-${option.icon} mr-2 ${
                    filters.sortBy === option.name ? "text-yellow-400" : ""
                  }`}
                ></i>
                {option.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tailors Grid */}
        <div
          className={`${theme.mainTheme} w-full rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 mt-1 mb-3 md:mb-1 mx-auto`}
        >
          {loading ? (
            <div className="col-span-full flex justify-center items-center h-96">
              <ClipLoader color="#ffffff" size={60} />
            </div>
          ) : (
            <>
              {tailorList.length <= 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full flex flex-col items-center justify-center h-96"
                >
                  <i
                    className={`fas fa-user-tie text-4xl mb-4 ${theme.colorText} opacity-50`}
                  ></i>
                  <span
                    className={`text-2xl font-bold mb-4 ${theme.colorText}`}
                  >
                    No tailors found
                  </span>
                  <button
                    onClick={clearFilters}
                    className={`px-4 py-2 rounded-lg ${theme.hoverBg} ${theme.colorText} flex items-center`}
                  >
                    <i className="fas fa-broom mr-2"></i>
                    Clear filters
                  </button>
                </motion.div>
              ) : (
                tailorList.map((tailor, index) => (
                  <motion.div
                    key={tailor.id}
                    variants={tailorVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 ${theme.colorBorder} ${theme.hoverShadow} flex flex-col`}
                    onClick={() => handleTailorClick(tailor)}
                  >
                    <div className="relative overflow-hidden aspect-[3/2] w-full">
                      <Image
                        src={
                          tailor.businessPictureUrl ||
                          "/images/profile/business/default.png"
                        }
                        alt={`Image of ${tailor.businessName}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        priority
                      />
                    </div>
                    <div
                      className={`p-3 rounded-b-xl ${theme.colorBg} overflow-hidden flex-grow`}
                    >
                      <h3
                        className={`font-semibold line-clamp-1 ${theme.colorText}`}
                      >
                        {tailor.businessName}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${theme.colorText} opacity-80 flex items-center line-clamp-1`}
                      >
                        <i className="fas fa-map-marker-alt mr-2 text-xs"></i>
                        {tailor.businessAddress || "Location not specified"}
                      </p>
                      <div className="flex overflow-hidden items-center mt-2">
                        <div className="flex">
                          {renderStars(tailor.normalizedRating)}
                        </div>
                        <span className={`text-xs ml-1 ${theme.colorText}`}>
                          ({tailor.normalizedRating.toFixed(1)})
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-sm ${theme.colorText} flex items-center`}
                      >
                        <i className="fas fa-clock mr-2"></i>
                        {tailor.openTime || "09:00"} -{" "}
                        {tailor.closeTime || "18:00"}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </>
          )}
        </div>

        {popupVisible && (
          <QuickView
            theme={theme}
            tailor={selectedTailor}
            setPopupVisible={setPopupVisible}
            popupVisible={popupVisible}
          />
        )}

        {/* Filter Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              ref={dropdownRef}
              className={`absolute top-0 right-[20px] mt-2 p-4 ${theme.mainTheme} rounded-md shadow-lg border ${theme.colorBorder}`}
              style={{
                top: dropdownPosition.top,
                zIndex: 1000,
                width: "fit-content",
              }}
              initial="hidden"
              animate={dropdownOpen ? "visible" : "hidden"}
              exit="exit"
              variants={dropdownVariants}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <div className="relative min-w-[18rem] mb-4">
                <h3
                  className={`font-bold text-lg mb-2 ${theme.colorText} flex items-center`}
                >
                  <i className="fas fa-filter mr-2"></i>
                  Filter by Speciality
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {specialities.map((speciality) => (
                    <motion.div
                      key={speciality.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChange(speciality.name)}
                      className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                        specialityFilter.includes(speciality.name)
                          ? `${theme.hoverBg} bg-opacity-50`
                          : `${theme.colorBg}`
                      } ${theme.colorBorder}`}
                    >
                      {specialityFilter.includes(speciality.name) && (
                        <i className="fas fa-check text-green-500 mr-3"></i>
                      )}
                      <i
                        className={`fas fa-${speciality.icon} mr-3 ${
                          specialityFilter.includes(speciality.name)
                            ? "text-blue-400"
                            : ""
                        }`}
                      ></i>
                      <span className={theme.colorText}>{speciality.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <SimpleButton
                  type={"simple"}
                  btnText={
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Apply Filters
                    </>
                  }
                  extraclasses={`px-4 py-2 rounded-lg flex-grow`}
                  onClick={applyFilters}
                />
                <SimpleButton
                  type={"simple"}
                  btnText={
                    <>
                      <i className="fas fa-broom mr-2"></i>
                      Clear
                    </>
                  }
                  extraclasses={`px-4 py-2 rounded-lg border ${theme.colorBorder}`}
                  onClick={clearFilters}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Tailors;
