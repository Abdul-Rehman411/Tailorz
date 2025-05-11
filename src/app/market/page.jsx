"use client";

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipLoader } from "react-spinners";
import UserContext from "@/utils/UserContext";
import SimpleButton from "@/components/SimpleButton";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { db } from "@/utils/firebaseConfig";
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import TrendPop from "@/components/TrendPop";
import AddToCart from "@/components/AddToCart";

const Market = () => {
  const { theme, userData, setShowMessage, setPopUpMessageTrigger } =
    useContext(UserContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const TailorProductsView = searchParams.get("tailor");

  const genders = [
    { name: "Male", icon: "male" },
    { name: "Female", icon: "female" },
    { name: "Kids", icon: "child" },
    { name: "Unisex", icon: "tshirt" },
  ];

  const sortOptions = [
    { name: "Recommended", icon: "star" },
    { name: "Price: Low to High", icon: "dollar-sign" },
    { name: "Price: High to Low", icon: "dollar-sign" },
    { name: "Newest First", icon: "clock" },
  ];

  const [filters, setFilters] = useState({
    sortBy: "Recommended",
    showCount: 60,
    page: 1,
  });
  const [selectedGenderFilter, setSelectedGenderFilter] = useState([]); // Temporary selection
  const [appliedGenderFilter, setAppliedGenderFilter] = useState([]); // Applied filters
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAddToCart, setShowAddToCart] = useState(false);

  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all active tailor products
      const productsQuery = TailorProductsView
        ? query(
            collection(db, "tailorProducts"),
            where("isActive", "==", true),
            where("tailorId", "==", TailorProductsView)
          )
        : query(
            collection(db, "tailorProducts"),
            where("isActive", "==", true)
          );
      const productsSnapshot = await getDocs(productsQuery);

      // Process each product to get tailor and rating details
      const productsData = await Promise.all(
        productsSnapshot.docs.map(async (Doc) => {
          const productData = {
            id: Doc.id,
            ...Doc.data(),
          };

          // Get tailor's business name and image
          let tailorName = "Unknown Tailor";
          let tailorImage = "/images/default-tailor.png";
          try {
            if (productData.tailorId) {
              const tailorDocReference = doc(
                db,
                "tailors",
                productData.tailorId
              );
              const tailorDoc = await getDoc(tailorDocReference);
              if (tailorDoc.exists()) {
                const tailorData = tailorDoc.data();
                tailorName = tailorData.businessName || tailorName;
                tailorImage = tailorData.businessPictureUrl || tailorImage;
              }
            }
          } catch (error) {
            console.error("Error fetching tailor data:", error);
          }

          // Get rating data
          let rating = 0;
          let totalReviews = 0;
          try {
            const ratingQuery = query(
              collection(db, "productRatings"),
              where("productId", "==", productData.productId)
            );
            const ratingSnapshot = await getDocs(ratingQuery);

            if (!ratingSnapshot.empty) {
              const ratingDoc = ratingSnapshot.docs[0];
              const ratingData = ratingDoc.data();
              const { rating: totalScore = 0, totalRating = 0 } = ratingData;

              if (totalRating > 0) {
                rating = (totalScore / totalRating) * 5;
                totalReviews = totalRating / 6;
              }
            }
          } catch (error) {
            console.error("Error fetching rating data:", error);
          }

          return {
            id: productData.id,
            ...productData,
            tailor: tailorName,
            tailorImage,
            rating,
            totalReviews: Math.floor(totalReviews),
            gender: productData.baseProductData.gender,
          };
        })
      );

      let products = [...productsData];

      // Apply search filter
      if (searchQuery) {
        products = products.filter(
          (product) =>
            product.baseProductData?.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            product.tailor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.baseProductData?.material
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())
        );
      }

      // Apply gender filters
      if (appliedGenderFilter.length > 0) {
        products = products.filter((product) =>
          appliedGenderFilter.includes(product.gender)
        );
      }

      // Apply sorting
      switch (filters.sortBy) {
        case "Price: Low to High":
          products.sort((a, b) => a.price - b.price);
          break;
        case "Price: High to Low":
          products.sort((a, b) => b.price - a.price);
          break;
        case "Newest First":
          products.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "Recommended":
        default:
          // Sort by rating then by newest
          products.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          break;
      }

      setProductList(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setLoading(false);
  }, [filters.sortBy, appliedGenderFilter, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const productVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const quickViewVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
  };

  const imageVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
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

  const handleGenderSelection = (value) => {
    setSelectedGenderFilter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const applyFilters = () => {
    setAppliedGenderFilter(selectedGenderFilter);
    setDropdownOpen(false);
  };

  const clearFilters = () => {
    setSelectedGenderFilter([]);
    setAppliedGenderFilter([]);
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

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setQuickViewOpen(true);
  };

  const handleCustomizeClick = (product) => {
    if (!selectedProduct) return;
    // Before navigating
    sessionStorage.setItem("product", JSON.stringify(product));
    const formatCategory = (str = "") => {
      const words = str.trim().split(/\s+/);
      if (words.length === 1) {
        return words[0].toLowerCase();
      }
      return words
        .map((word, index) =>
          index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
    };

    const category = formatCategory(
      selectedProduct.baseProductData?.category || "shirt"
    );
    router.push(`/outfit-customization?outfit=${category}`);
  };

  const handleAddToCart = () => {
    if (!userData?.uid) {
      setShowMessage({
        type: "info",
        message: "Please login to add items to cart",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    const productWithEmptyLink = {
      ...selectedProduct,
      customizedProductLink: "",
    };

    setSelectedProduct(productWithEmptyLink);
    setShowAddToCart(true);
  };

  const nextImage = () => {
    const images = selectedProduct?.isCustom
      ? selectedProduct.images
      : [selectedProduct?.baseProductData?.imageUrl];

    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    const images = selectedProduct?.isCustom
      ? selectedProduct.images
      : [selectedProduct?.baseProductData?.imageUrl];

    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const getProductImages = () => {
    if (!selectedProduct) return [];
    return selectedProduct.isCustom
      ? selectedProduct.images
      : [selectedProduct.baseProductData?.imageUrl];
  };

  const [tailorName, setTailorName] = useState(null);

  useEffect(() => {
    if (!TailorProductsView) return;

    setTailorName(null); // start loading
    const tailorDocRef = doc(db, "tailors", TailorProductsView);

    getDoc(tailorDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setTailorName(docSnap.data().businessName);
        } else {
          setTailorName("");
        }
      })
      .catch(() => {
        setTailorName("");
      });
  }, [TailorProductsView]);

  // Now build the message
  let emptyMessage = "No products found";

  if (TailorProductsView) {
    if (tailorName === null) {
      emptyMessage += ". Checking tailor info…";
    } else if (tailorName === "") {
      emptyMessage +=
        ". This tailor doesn't exist. Check the tailor ID and try again";
    } else {
      emptyMessage += `. ${tailorName} hasn't listed any products yet`;
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className={`max-w-[99.5%] mx-auto my-4 md:my-1 h-full select-none`}>
        <div className={`p-4 ${theme.mainTheme} rounded-lg`}>
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-2xl font-bold ${theme.colorText}  ${
                searchActive ? "hidden md:block" : "block"
              }`}
            >
              {TailorProductsView ? tailorName : "TailorEase Market"}
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
                      placeholder="Search products..."
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
          {(appliedGenderFilter.length > 0 || searchQuery) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mb-4"
            >
              <span className={`text-sm ${theme.colorText}`}>
                <i className="fas fa-filter mr-1"></i>
                Active filters:
              </span>
              {appliedGenderFilter.map((filter) => (
                <motion.span
                  key={`gen-${filter}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-3 py-1 text-xs rounded-full ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} flex items-center`}
                >
                  <i
                    className={`fas fa-${
                      filter === "Male"
                        ? "male"
                        : filter === "Female"
                        ? "female"
                        : filter === "Kids"
                        ? "child"
                        : "tshirt"
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

        {/* Products Grid */}
        <div
          className={`${theme.mainTheme} w-full rounded-xl overflow-hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 mt-1 mb-3 md:mb-1 mx-auto`}
        >
          {loading ? (
            <div className="col-span-full flex justify-center items-center h-96">
              <ClipLoader color="#ffffff" size={60} />
            </div>
          ) : (
            <>
              {productList.length <= 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full flex flex-col items-center justify-center h-96"
                >
                  <i
                    className={`fas fa-tshirt text-4xl mb-4 ${theme.colorText} opacity-50`}
                  ></i>
                  <span
                    className={`text-2xl font-bold text-center mb-4 ${theme.colorText}`}
                  >
                    {emptyMessage}
                    {TailorProductsView && (
                      <div
                        className={`block text-sm mt-4 w-fit mx-auto p-2 rounded-lg ${theme.hoverBg}`}
                      >
                        <a href="/market">Browse all products</a>
                      </div>
                    )}
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
                productList.map((product, index) => (
                  <motion.div
                    key={product.id || `product-${index}`}
                    variants={productVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 ${theme.colorBorder} ${theme.hoverShadow} flex flex-col`}
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="relative overflow-hidden aspect-square w-full">
                      <Image
                        src={
                          product.isCustom && product.images?.length > 0
                            ? product.images[0]
                            : product.baseProductData?.imageUrl ||
                              "/images/default-product.png"
                        }
                        alt={product.baseProductData?.name || "Product"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        priority
                      />
                      {product.has3DTryOn && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <i className="fas fa-vr-cardboard mr-1"></i>
                          3D Try-On
                        </div>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-b-xl ${theme.colorBg} overflow-hidden flex-grow`}
                    >
                      <h3
                        className={`font-semibold line-clamp-2 ${theme.colorText}`}
                      >
                        {product.baseProductData?.name || "Unnamed Product"}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${theme.colorText} opacity-80 flex items-center`}
                      >
                        <i
                          className={`fas fa-${
                            product.gender === "Male"
                              ? "male"
                              : product.gender === "Female"
                              ? "female"
                              : product.gender === "Kids"
                              ? "child"
                              : "tshirt"
                          } mr-2 text-xs`}
                        ></i>
                        by {product.tailor}
                      </p>
                      <div className="flex overflow-hidden items-center mt-2">
                        <div className="flex">
                          {renderStars(product.rating)}
                        </div>
                        <span className={`text-xs ml-1 ${theme.colorText}`}>
                          ({product.totalReviews})
                        </span>
                      </div>
                      <p
                        className={`mt-2 font-bold text-lg ${theme.colorText} flex items-center`}
                      >
                        <span className="text-xs mr-1">PKR</span>
                        {product.price.toLocaleString("en-PK")}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </>
          )}
        </div>

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
                  <i className="fas fa-venus-mars mr-2"></i>
                  Filter by Gender
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {genders.map((gender) => (
                    <motion.div
                      key={gender.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGenderSelection(gender.name)}
                      className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                        selectedGenderFilter.includes(gender.name)
                          ? `${theme.hoverBg} bg-opacity-50`
                          : `${theme.colorBg}`
                      } ${theme.colorBorder}`}
                    >
                      {selectedGenderFilter.includes(gender.name) && (
                        <i className="fas fa-check text-green-500 mr-3"></i>
                      )}
                      <i
                        className={`fas fa-${gender.icon} mr-3 ${
                          selectedGenderFilter.includes(gender.name)
                            ? "text-blue-400"
                            : ""
                        }`}
                      ></i>
                      <span className={theme.colorText}>{gender.name}</span>
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

        {/* Quick View Modal */}
        <AnimatePresence>
          {quickViewOpen && selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <motion.div
                className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl overflow-hidden ${theme.colorBg} shadow-2xl flex flex-col md:flex-row`}
                variants={quickViewVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                {/* Close Button */}
                <button
                  className={`absolute top-4 right-4 z-10 py-2 px-4 rounded-full ${theme.colorBgSecondary} ${theme.colorText} hover:bg-red-500 hover:text-white transition-colors`}
                  onClick={() => setQuickViewOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>

                {/* Image Gallery */}
                <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
                  <AnimatePresence custom={1} initial={false}>
                    <motion.div
                      key={currentImageIndex}
                      custom={1}
                      variants={imageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Image
                        src={
                          getProductImages()[currentImageIndex] ||
                          "/images/default-product.png"
                        }
                        alt={selectedProduct.baseProductData?.name || "Product"}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {getProductImages().length > 1 && (
                    <>
                      <button
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${theme.colorBgSecondary} ${theme.colorText} hover:bg-blue-500 hover:text-white transition-colors`}
                        onClick={prevImage}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${theme.colorBgSecondary} ${theme.colorText} hover:bg-blue-500 hover:text-white transition-colors`}
                        onClick={nextImage}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </>
                  )}

                  {/* Image Indicators */}
                  {getProductImages().length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {getProductImages().map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentImageIndex === index
                              ? "bg-blue-500 w-4"
                              : "bg-gray-300"
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                  <div className="flex items-center mb-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                      <Image
                        src={selectedProduct.tailorImage}
                        alt={selectedProduct.tailor}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        priority
                      />
                    </div>
                    <span className={`font-medium ${theme.colorText}`}>
                      {selectedProduct.tailor}
                    </span>
                  </div>

                  <h2 className={`text-2xl font-bold mb-2 ${theme.colorText}`}>
                    {selectedProduct.baseProductData?.name || "Unnamed Product"}
                  </h2>

                  <div className="flex items-center mb-4">
                    <div className="flex mr-2">
                      {renderStars(selectedProduct.rating)}
                    </div>
                    <span className={`text-sm ${theme.colorText} opacity-80`}>
                      ({selectedProduct.totalReviews} reviews)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${theme.colorBgSecondary} ${theme.colorText}`}
                    >
                      <i
                        className={`fas fa-${
                          selectedProduct.gender === "Male"
                            ? "male"
                            : selectedProduct.gender === "Female"
                            ? "female"
                            : selectedProduct.gender === "Kids"
                            ? "child"
                            : "tshirt"
                        } mr-1`}
                      ></i>
                      {selectedProduct.gender}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${theme.colorBgSecondary} ${theme.colorText}`}
                    >
                      <i className="fas fa-tag mr-1"></i>
                      {selectedProduct.baseProductData?.category ||
                        "Uncategorized"}
                    </span>
                    {selectedProduct.baseProductData?.material && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${theme.colorBgSecondary} ${theme.colorText}`}
                      >
                        <i className="fas fa-cut mr-1"></i>
                        {selectedProduct.baseProductData.material}
                      </span>
                    )}
                    {selectedProduct.has3DTryOn && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}
                      >
                        <i className="fas fa-vr-cardboard mr-1"></i>
                        3D Try-On Available
                      </span>
                    )}
                    {selectedProduct.isCustom && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}
                      >
                        <i className="fas fa-magic mr-1"></i>
                        Custom Product
                      </span>
                    )}
                  </div>

                  <p className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                    PKR {selectedProduct.price.toLocaleString("en-PK")}
                  </p>

                  <p className={`mb-6 ${theme.colorText} opacity-90`}>
                    {selectedProduct.description ||
                      selectedProduct.baseProductData?.name +
                        " stitching service"}
                  </p>

                  <div className="flex flex-col gap-3">
                    <SimpleButton
                      btnText={"View Product"}
                      type={"default"}
                      icon={<i className="fas fa-eye"></i>}
                      onClick={() => {
                        router.push(`/market/product?id=${selectedProduct.id}`);
                      }}
                    />

                    {selectedProduct.has3DTryOn && (
                      <SimpleButton
                        btnText={
                          <>
                            <i className="fas fa-magic mr-2"></i>
                            Try-On In 3D
                          </>
                        }
                        type="default"
                        fullWidth
                        onClick={() => {
                          handleCustomizeClick(selectedProduct);
                        }}
                      />
                    )}
                    <SimpleButton
                      btnText={
                        <>
                          <i className="fas fa-shopping-cart mr-2"></i>
                          Add to Cart
                        </>
                      }
                      type="accent"
                      fullWidth
                      onClick={handleAddToCart}
                    />
                  </div>

                  <div className={`mt-6 pt-6 border-t ${theme.colorBorder}`}>
                    <h3 className={`font-bold mb-2 ${theme.colorText}`}>
                      <i className="fas fa-truck mr-2"></i>
                      Delivery Information
                    </h3>
                    <p className={`text-sm ${theme.colorText} opacity-80`}>
                      Ready in {selectedProduct.deliveryTime || "7-14 days"} •
                      Free shipping on orders over PKR 5,000
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <TrendPop />

      {/* Add to Cart Animation */}
      {showAddToCart && selectedProduct && (
        <AddToCart
          product={selectedProduct}
          onClose={() => setShowAddToCart(false)}
          theme={theme}
          customizedProductLink={""}
          userId={userData?.uid}
        />
      )}
    </div>
  );
};

export default Market;
