"use client";
import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/utils/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

import { ClipLoader } from "react-spinners";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SimpleButton from "@/components/SimpleButton";
import UserContext from "@/utils/UserContext";
import Link from "next/link";
import UpdateTailorRating from "@/components/UpdateTailorRating";
import DialogBox from "@/components/DialogBox";
import { motion, AnimatePresence } from "framer-motion";

const TailorProfile = () => {
  const [tailorData, setTailorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userReview, setUserReview] = useState("");
  const [rating, setRating] = useState(0);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTailorConnected, setIsTailorConnected] = useState(false);

  const router = useRouter();
  const {
    theme,
    userLoggedIn,
    userData,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const { id } = useParams();
  const [statusMessage, setStatusMessage] = useState({
    type: "",
    message: "",
  });
  const [fetchedReviews, setFetchedReviews] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showDialog, setShowDialog] = useState(false);
  const [dialogBoxInfo, setDialogBoxInfo] = useState({
    title: "",
    body: "",
    type: "",
    buttons: [],
  });

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

  useEffect(() => {
    const fetchTailorData = async () => {
      try {
        setIsLoading(true);

        // Fetch the tailor data
        const tailorDocRef = doc(db, "tailors", id);
        const docSnap = await getDoc(tailorDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTailorData(data);

          // Fetch reviews related to this tailor
          const reviewsRef = collection(db, "tailor_reviews");
          const reviewsQuery = query(reviewsRef, where("tailor_id", "==", id));
          const reviewsSnap = await getDocs(reviewsQuery);

          const reviewsData = [];
          const userPromises = [];

          reviewsSnap.forEach((reviewDoc) => {
            const reviewData = { ...reviewDoc.data(), userName: null };
            reviewsData.push(reviewData);

            // Fetch the user data
            userPromises.push(
              getDocs(
                query(
                  collection(db, "users"),
                  where("uid", "==", reviewData.user_id)
                )
              )
                .then((userSnap) => {
                  if (!userSnap.empty) {
                    const userData = userSnap.docs[0].data();
                    reviewData.userName = userData.fullName || "Unknown User";
                  }
                })
                .catch((err) => console.error("Error fetching user:", err))
            );
          });

          await Promise.all(userPromises);

          setFetchedReviews(reviewsData);

          // Fetch order statistics and top rated products
          const fetchOrderData = async () => {
            const ordersQuery = query(
              collection(db, "OrdersManagement"),
              where("tailorId", "==", id)
            );
            const ordersSnapshot = await getDocs(ordersQuery);

            let inQueue = 0;
            let active = 0;
            let successful = 0;
            let cancelled = 0;

            ordersSnapshot.forEach((doc) => {
              const order = doc.data();
              switch (order.orderStatus) {
                case "paymentVerificationPending":
                  inQueue++;
                  break;
                case "paymentVerified":
                case "startedStitching":
                case "onDelivery":
                  active++;
                  break;
                case "delivered":
                  successful++;
                  break;
                case "cancelled":
                  cancelled++;
                  break;
              }
            });

            setOrderStats({
              inQueue,
              active,
              successful,
              cancelled,
            });

            // Fetch top rated products
            const productsQuery = query(
              collection(db, "tailorProducts"),
              where("tailorId", "==", id),
              where("isActive", "==", true),
              limit(10)
            );
            const productsSnapshot = await getDocs(productsQuery);

            const productsWithRatings = await Promise.all(
              productsSnapshot.docs.map(async (productDoc) => {
                const productData = productDoc.data();
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
                    const { rating: totalScore = 0, totalRating = 0 } =
                      ratingData;

                    if (totalRating > 0) {
                      rating = (totalScore / totalRating) * 5;
                      totalReviews = totalRating / 6;
                    }
                  }
                } catch (error) {
                  console.error("Error fetching rating data:", error);
                }

                return {
                  id: productDoc.id,
                  ...productData,
                  rating,
                  totalReviews: Math.floor(totalReviews),
                };
              })
            );

            // Sort by rating (highest first) then by number of reviews
            const sortedProducts = productsWithRatings.sort((a, b) => {
              if (b.rating !== a.rating) return b.rating - a.rating;
              return b.totalReviews - a.totalReviews;
            });

            setTopProducts(sortedProducts.slice(0, 3));
            setLoadingProducts(false);
          };

          fetchOrderData();
        } else {
          setShowMessage({
            type: "info",
            message: "No Such Tailor",
          });
          setPopUpMessageTrigger(true);
        }
      } catch (error) {
        console.error("Error fetching tailor data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTailorData();
  }, [id, setPopUpMessageTrigger, setShowMessage]);

  const handleReviewSubmit = async () => {
    if (!userLoggedIn) {
      setDialogBoxInfo({
        body: "You must be logged in to submit a review. Go to log in page now?",
        title: "Login Required!",
        type: "info",
        buttons: [
          {
            label: "Login Now",
            onClick: () =>
              router.push(`/login?redirect=/tailors/profile/${id}`),
            type: "primary",
          },
        ],
      });
      setShowDialog(true);
      return;
    }

    if (userData.uid === tailorData.ownerId) {
      setShowMessage({
        type: "warning",
        message: "You cannot review your own business account",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (rating === 0) {
      setShowMessage({
        type: "info",
        message: "Please select a star rating",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (userReview.split(" ").length < 3) {
      setShowMessage({
        type: "info",
        message: "Please write at least 3 words in the review",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    const userId = userData.uid;

    try {
      setIsSubmitting(true);

      await UpdateTailorRating({
        message: userReview,
        stars: rating,
        userId,
        tailorId: id,
        setStatusMessage: (status) => {
          setStatusMessage(status);
          setShowMessage(status);
        },
      });
      setPopUpMessageTrigger(true);
      setRating(0);
      setUserReview("");
      setFetchedReviews((prev) => [
        ...prev,
        {
          stars: rating,
          message: userReview,
          user_id: userData.uid,
          tailor_id: tailorData.id,
          userName: userData.fullName,
        },
      ]);
    } catch (error) {
      console.error("Error submitting review:", error);
      setShowMessage({
        type: "danger",
        message: "Failed to submit review. Please try again later.",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClickContact = () => {
    const message =
      `Hi, I'm interested in your services from TailorEase.` +
      (userData?.uid
        ? ` Here is my profile link on the TailorEase Platform: ${window.location.origin}/user?share=${userData.uid}`
        : "");

    const url = `https://wa.me/${
      tailorData.countryCode + tailorData.businessPhone
    }?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    if (userLoggedIn && userData?.uid && id) {
      const relId = `${id}_${userData.uid}`;
      const docRef = doc(db, "userTailorConnections", relId);

      getDoc(docRef)
        .then((docSnap) => {
          setIsTailorConnected(docSnap.exists());
        })
        .catch((err) => {
          console.error("Error checking tailor connection:", err);
        });
    }
  }, [userLoggedIn, userData?.uid, id]);

  const handleAddTailor = async () => {
    if (userLoggedIn && userData?.uid) {
      try {
        const relId = `${id}_${userData.uid}`;
        await setDoc(doc(db, "userTailorConnections", relId), {
          tailorId: id,
          userId: userData.uid,
          timestamp: new Date(),
        });

        setIsTailorConnected(true);
        setShowMessage({
          message: "Tailor added to My Tailors.",
          type: "success",
        });
        setPopUpMessageTrigger(true);
      } catch (error) {
        console.error("Error adding tailor connection:", error);
        setShowMessage({
          message: "Couldn't add the tailor. Try again.",
          type: "danger",
        });
        setPopUpMessageTrigger(true);
      }
    } else {
      setShowMessage({
        message: "Please log in to add this tailor to your tailors.",
        type: "danger",
      });
      setPopUpMessageTrigger(true);
    }
  };

  const handleRemoveTailor = async () => {
    if (userLoggedIn && userData?.uid) {
      try {
        const relId = `${id}_${userData.uid}`;
        await deleteDoc(doc(db, "userTailorConnections", relId));

        setIsTailorConnected(false);
        setShowMessage({
          message: "Tailor removed from My Tailors.",
          type: "success",
        });
        setPopUpMessageTrigger(true);
      } catch (error) {
        console.error("Error removing tailor connection:", error);
        setShowMessage({
          message: "Couldn't remove the tailor. Try again.",
          type: "danger",
        });
        setPopUpMessageTrigger(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div
        className={`max-w-[99.5%] mx-auto my-4 md:my-1 flex justify-center items-center h-screen ${theme.mainTheme}`}
      >
        <ClipLoader size={60} color="#ffffff" />
      </div>
    );
  }

  const iconMap = {
    "Men Specialist": "fas fa-male",
    "Women Specialist": "fas fa-female",
    "Kids Specialist": "fas fa-child",
    Alterations: "fas fa-sync-alt",
    "Custom Tailoring": "fas fa-tshirt",
    Other: "fas fa-ellipsis-h",
  };

  const ratingValue = tailorData?.rating || 0;
  const totalRating = tailorData?.total_rating || 0;
  const calculatedRating =
    totalRating > 0 ? (ratingValue / totalRating) * 5 : 0;

  const numberOfReviews = totalRating > 0 ? totalRating / 6 : 0;

  return tailorData ? (
    <div className="h-full overflow-y-auto">
      <div
        className={`max-w-[99.5%] mx-auto my-4 md:my-1 rounded-lg h-fit py-5 md:py-12 px-5 lg:px-10 ${theme.mainTheme} ${theme.colorText}`}
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row items-center gap-8 mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative border-white border w-full lg:w-64 h-48 rounded-xl overflow-hidden shadow-xl"
            style={{ aspectRatio: "3/2" }}
          >
            <Image
              src={
                tailorData.businessPictureUrl ||
                "/images/profile/business/default.png"
              }
              alt={tailorData.businessName || "Business Name"}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL="/images/profile/business/default.png"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              priority
            />
          </motion.div>

          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold mb-2"
            >
              {tailorData.businessName}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center mb-4"
            >
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.floor(calculatedRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg">
                {calculatedRating.toFixed(1)} ({numberOfReviews} reviews)
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 mb-6"
            >
              <div className="flex items-center">
                <i className="fas fa-clock mr-2 text-blue-500"></i>
                <span>
                  {tailorData.openTime} - {tailorData.closeTime}
                </span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-briefcase mr-2 text-purple-500"></i>
                <span>{tailorData.experience || "N/A"} years experience</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                <span>
                  {tailorData.businessAddress || "Address not provided"}
                </span>
              </div>
            </motion.div>

            <div className="flex space-x-2">
              <SimpleButton
                btnText={"Contact"}
                type={"accent"}
                icon={
                  <i className="fab fa-whatsapp text-green-700 text-xl"></i>
                }
                onClick={handleClickContact}
              />

              <SimpleButton
                btnText={isTailorConnected ? "Remove Tailor" : "Add Tailor"}
                type={"default"}
                icon={
                  <i
                    className={`fas fa-${isTailorConnected ? "remove" : "add"}`}
                  ></i>
                }
                onClick={
                  isTailorConnected ? handleRemoveTailor : handleAddTailor
                }
              />
              <SimpleButton
                btnText={"Share"}
                type={"default"}
                icon={<i className="fas fa-share-alt"></i>}
                onClick={() => {
                  const url = `${window.location.origin}/tailors/profile/${id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setShowMessage({
                      message: "Link copied to clipboard!",
                      type: "success",
                    });
                    setPopUpMessageTrigger(true);
                  });
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2 inline-block">
          Orders Stats
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12`}
        >
          {[
            {
              icon: "fas fa-clock",
              color: "text-blue-500",
              title: "In Queue",
              value: orderStats?.inQueue || 0,
              bg: "bg-blue-200",
            },
            {
              icon: "fas fa-tools",
              color: "text-yellow-500",
              title: "Active",
              value: orderStats?.active || 0,
              bg: "bg-yellow-100",
            },
            {
              icon: "fas fa-check-circle",
              color: "text-green-500",
              title: "Completed",
              value: orderStats?.successful || 0,
              bg: "bg-green-100",
            },
            {
              icon: "fas fa-times-circle",
              color: "text-red-500",
              title: "Cancelled",
              value: orderStats?.cancelled || 0,
              bg: "bg-red-100",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`p-6 rounded-xl shadow-md ${theme.colorBg} flex flex-col items-center transition-all duration-300`}
            >
              <div
                className={`w-16 h-16 ${stat.bg} rounded-full flex items-center justify-center mb-4`}
              >
                <i className={`${stat.icon} ${stat.color} text-2xl`}></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">{stat.title}</h3>
              <span className="text-3xl font-bold">{stat.value}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* About Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2 inline-block">
            About
          </h2>
          <p className="text-lg leading-relaxed">
            {tailorData.description || (
              <span className="italic text-gray-500">
                No description provided
              </span>
            )}
          </p>
        </motion.section>

        {/* Specialties Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 border-b-2 pb-2 inline-block">
            Craftsmanship Specialties
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tailorData.specialities?.length > 0 ? (
              tailorData.specialities.map((speciality, index) => {
                const iconClass = iconMap[speciality] || "fas fa-scissors";
                return (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className={`p-4 rounded-lg ${theme.colorBg} flex flex-col items-center justify-center text-center h-32 transition-all duration-300`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-3">
                      <i className={`${iconClass} text-white`}></i>
                    </div>
                    <h3 className="font-medium text-sm md:text-base">
                      {speciality}
                    </h3>
                    <div className="absolute inset-0 border-2 border-transparent hover:border-blue-400 rounded-lg transition-all duration-300 pointer-events-none"></div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <i className="fas fa-tshirt text-4xl mb-4 opacity-50"></i>
                <p className="italic text-gray-500">
                  No specialties listed yet
                </p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Top Products Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold border-b-2 pb-2 inline-block">
              {topProducts.length > 0 ? "Featured Products" : "Products"}
            </h2>
            <Link href={`/market?tailor=${id}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg ${theme.hoverBg} ${theme.colorText} flex items-center`}
              >
                <i className="fas fa-eye mr-2"></i>
                View All Products
              </motion.button>
            </Link>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center items-center h-40">
              <ClipLoader size={40} color="#ffffff" />
            </div>
          ) : topProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {topProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`rounded-xl overflow-hidden border ${theme.colorBorder} ${theme.hoverShadow} cursor-pointer transition-all duration-300`}
                  onClick={() =>
                    router.push(`/market/product?id=${product.id}`)
                  }
                >
                  <div className="relative h-64">
                    <Image
                      src={
                        product.baseProductData?.imageUrl ||
                        "/images/default-product.png"
                      }
                      alt={product.baseProductData?.name || "Product"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h3 className="text-white font-semibold text-lg">
                        {product.baseProductData?.name || "Unnamed Product"}
                      </h3>
                    </div>
                  </div>
                  <div className={`p-4 ${theme.colorBg}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${theme.colorText} opacity-80`}>
                        {product.baseProductData?.category || "Uncategorized"}
                      </span>
                      <div className="flex items-center">
                        <div className="flex mr-1">
                          {renderStars(product.rating)}
                        </div>
                        <span
                          className={`text-xs ${theme.colorText} opacity-80 ml-1`}
                        >
                          ({product.totalReviews || 0})
                        </span>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${theme.colorText}`}>
                      PKR {product.price?.toLocaleString("en-PK") || "0"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-8 text-center rounded-xl ${theme.colorBgSecondary}`}
            >
              <i
                className={`fas fa-tshirt text-5xl mb-4 ${theme.colorText} opacity-50`}
              ></i>
              <p className={`text-lg ${theme.colorText}`}>
                No products available yet
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* Reviews Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-8 border-b-2 pb-2 inline-block">
            Customer Reviews
          </h2>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Reviews Carousel */}
            <div className="w-full lg:w-2/3">
              {fetchedReviews.length > 0 ? (
                <div className="relative h-96">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentReviewIndex}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5 }}
                      className={`absolute inset-0 p-8 rounded-xl shadow-lg ${theme.colorBgSecondary} flex flex-col items-center justify-center`}
                    >
                      <div className="text-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-user text-white text-3xl"></i>
                        </div>
                        <h3 className="text-xl font-bold">
                          {fetchedReviews[currentReviewIndex].userName}
                        </h3>
                        <div className="flex justify-center my-3">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-6 h-6 ${
                                i < fetchedReviews[currentReviewIndex].stars
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className={`text-lg italic ${theme.colorText}`}>
                          &quot;{fetchedReviews[currentReviewIndex].message}
                          &quot;
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setCurrentReviewIndex((prevIndex) =>
                          prevIndex === 0
                            ? fetchedReviews.length - 1
                            : prevIndex - 1
                        );
                      }}
                      className={`w-12 h-12 rounded-full ${theme.colorBg} ${theme.hoverShadow} flex items-center justify-center`}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="flex items-center gap-2">
                      {fetchedReviews.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentReviewIndex(index)}
                          className={`w-3 h-3 rounded-full ${
                            index === currentReviewIndex
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setCurrentReviewIndex((prevIndex) =>
                          prevIndex === fetchedReviews.length - 1
                            ? 0
                            : prevIndex + 1
                        );
                      }}
                      className={`w-12 h-12 rounded-full ${theme.colorBg} ${theme.hoverShadow} flex items-center justify-center`}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-8 rounded-xl text-center ${theme.colorBgSecondary}`}
                >
                  <i className="fas fa-comment-slash text-4xl mb-4 opacity-50"></i>
                  <p className="text-lg">No reviews yet</p>
                  <p className="text-sm mt-2">
                    Be the first to review this tailor!
                  </p>
                </div>
              )}
            </div>

            {/* Leave Review Form */}
            <div className="w-full lg:w-1/3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-6 rounded-xl shadow-md ${theme.colorBgSecondary} sticky top-4`}
              >
                <h3 className="text-xl font-bold mb-4">
                  Share Your Experience
                </h3>

                <div className="mb-6">
                  <p className="mb-2">Your Rating</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl ${
                          star <= rating ? "text-yellow-400" : "text-gray-300"
                        } transition-colors duration-200`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative mb-6">
                  <textarea
                    value={userReview}
                    maxLength={250}
                    id="userReview"
                    name="userReview"
                    onChange={(e) => setUserReview(e.target.value)}
                    className={`${inputStyles} rounded-lg min-h-[120px] max-h-[180px] p-3 ${theme.colorBorder} border`}
                    rows={4}
                    placeholder=" "
                  />
                  <label
                    className={`${placeHolderStyles} top-3 left-3`}
                    htmlFor="userReview"
                  >
                    Your review...
                  </label>
                  <div className="text-right text-xs mt-1">
                    {userReview.length}/250
                  </div>
                </div>

                <SimpleButton
                  btnText={
                    isSubmitting ? (
                      <LoadingSpinner size={24} />
                    ) : (
                      "Submit Review"
                    )
                  }
                  type="primary-submit"
                  extraclasses="w-full"
                  disabled={isSubmitting}
                  onClick={handleReviewSubmit}
                />
              </motion.div>
            </div>
          </div>
        </motion.section>

        {showDialog && (
          <DialogBox
            body={dialogBoxInfo.body}
            title={dialogBoxInfo.title}
            type={dialogBoxInfo.type}
            buttons={dialogBoxInfo.buttons}
            showDialog={showDialog}
            setShowDialog={setShowDialog}
          />
        )}
      </div>
    </div>
  ) : (
    <div
      className={`max-w-[99.5%] mx-auto my-4 md:my-1 rounded-lg p-10 h-screen ${theme.mainTheme} flex items-center justify-center`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-6">Tailor Not Found!</h1>
        <Link href={"/tailors"}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium"
          >
            Browse All Tailors
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default TailorProfile;
