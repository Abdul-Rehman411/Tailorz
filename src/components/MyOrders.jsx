"use client";
import { useState, useEffect, useContext } from "react";
import { db } from "@/utils/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import UserContext from "@/utils/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import Image from "next/image";
import axios from "axios";

const MyOrders = () => {
  const { theme, userData } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [productRatings, setProductRatings] = useState({});
  const [productReviews, setProductReviews] = useState({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Order status configuration
  const statusConfig = {
    paymentVerificationPending: {
      title: "Payment Verification Pending",
      icon: "hourglass-half",
      color: "bg-yellow-500",
      description: "We're verifying your payment details",
    },
    paymentVerified: {
      title: "Payment Verified",
      icon: "check-circle",
      color: "bg-green-500",
      description: "Your payment has been confirmed",
    },
    startedStichting: {
      title: "Stitching Started",
      icon: "cut",
      color: "bg-blue-500",
      description: "Tailor has started working on your order",
    },
    onDelivery: {
      title: "On Delivery",
      icon: "truck",
      color: "bg-purple-500",
      description: "Your order is on its way",
    },
    delivered: {
      title: "Delivered",
      icon: "box-open",
      color: "bg-green-600",
      description: "Order has been delivered",
    },
    cancelled: {
      title: "Cancelled",
      icon: "ban",
      color: "bg-gray-500",
      description: "Order was cancelled",
    },
  };

  // Status progression for the timeline
  const statusProgression = [
    "paymentVerificationPending",
    "paymentVerified",
    "startedStichting",
    "onDelivery",
    "delivered",
  ];

  // Fetch orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.uid) return;

      setLoading(true);
      try {
        const q = query(
          collection(db, "OrdersManagement"),
          where("userId", "==", userData.uid),
          where("orderStatus", "!=", "inCart")
        );

        const querySnapshot = await getDocs(q);
        const ordersData = [];

        for (const orderDoc of querySnapshot.docs) {
          const orderData = orderDoc.data();
          let tailorDetails = {};

          // Fetch tailor details if tailorId exists
          if (orderData.tailorId) {
            try {
              const tailorDocRef = doc(db, "tailors", orderData.tailorId);
              const tailorDocSnap = await getDoc(tailorDocRef);

              if (tailorDocSnap.exists()) {
                const tailorData = tailorDocSnap.data();
                tailorDetails = {
                  businessName: tailorData.businessName,
                  businessPictureUrl:
                    tailorData.businessPictureUrl ||
                    "/images/default-tailor.png",
                };
              }
            } catch (error) {
              console.error("Error fetching tailor details:", error);
            }
          }

          ordersData.push({
            id: orderDoc.id, // Using the document ID as order ID
            ...orderData,
            tailorDetails,
            placedOnDate: orderData.placedOnDate || orderData.updatedAt,
          });
        }

        // Sort orders based on selected sort order
        ordersData.sort((a, b) => {
          const dateA = new Date(a.placedOnDate);
          const dateB = new Date(b.placedOnDate);
          return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        setOrders(ordersData);

        // Select the first order by default if available
        if (ordersData.length > 0 && !selectedOrder) {
          setSelectedOrder(ordersData[0]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData?.uid, sortOrder]);

  // Fetch product ratings and reviews when selected order changes
  useEffect(() => {
    const fetchProductRatingsAndReviews = async () => {
      if (!selectedOrder || selectedOrder.orderStatus !== "delivered") return;

      const ratings = {};
      const reviews = {};

      // Fetch ratings and reviews for each product in the order
      for (const product of selectedOrder.products) {
        if (!product.productId) continue;

        try {
          // Fetch product rating
          const ratingDocRef = doc(db, "productRatings", product.productId);
          const ratingDocSnap = await getDoc(ratingDocRef);

          if (ratingDocSnap.exists()) {
            ratings[product.productId] = ratingDocSnap.data();
          } else {
            ratings[product.productId] = {
              productId: product.productId,
              totalRating: 0,
              rating: 0,
            };
          }

          // Fetch user's review for this product
          const reviewsQuery = query(
            collection(db, "productReviews"),
            where("productId", "==", product.productId),
            where("userId", "==", userData.uid)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);

          if (!reviewsSnapshot.empty) {
            reviews[product.productId] = reviewsSnapshot.docs[0].data();
          }
        } catch (error) {
          console.error("Error fetching product ratings/reviews:", error);
        }
      }

      setProductRatings(ratings);
      setProductReviews(reviews);
    };

    fetchProductRatingsAndReviews();
  }, [selectedOrder, userData?.uid]);

  // Toggle search bar
  const toggleSearch = () => {
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchQuery("");
    }
  };

  // Filter orders based on search query (case insensitive)
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tailorDetails?.businessName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      // Handle both Firestore Timestamp objects and string dates
      const date =
        typeof dateString === "object" && dateString.toDate
          ? dateString.toDate()
          : new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      // Format with date and time
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Get status index for timeline
  const getStatusIndex = (status) => {
    return statusProgression.indexOf(status);
  };

  // Handle submitting a product review
  const handleSubmitReview = async (productId, stars, message) => {
    if (!userData?.uid || !selectedOrder || !productId || stars === 0) return;

    setIsSubmittingReview(true);

    try {
      // Step 1: Store the review in "productReviews"
      const reviewData = {
        productId,
        userId: userData.uid,
        stars,
        message,
        createdAt: new Date().toISOString(),
      };

      // Check if user already reviewed this product
      const reviewsQuery = query(
        collection(db, "productReviews"),
        where("productId", "==", productId),
        where("userId", "==", userData.uid)
      );
      const querySnapshot = await getDocs(reviewsQuery);

      if (!querySnapshot.empty) {
        console.log("User already reviewed this product");
        setIsSubmittingReview(false);
        return;
      }

      // Add the new review
      await addDoc(collection(db, "productReviews"), reviewData);

      // Step 2: Analyze sentiment score using API
      const options = {
        method: "GET",
        url: "https://twinword-sentiment-analysis.p.rapidapi.com/analyze/",
        params: {
          text: message,
        },
        headers: {
          "x-rapidapi-key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
          "x-rapidapi-host": process.env.NEXT_PUBLIC_RAPIDAPI_HOST,
        },
      };

      const response = await axios.request(options);
      const sentimentScore = response.data.score;

      // Step 3: Update product rating in "productRatings"
      const ratingDocRef = doc(db, "productRatings", productId);
      const ratingDocSnap = await getDoc(ratingDocRef);

      if (ratingDocSnap.exists()) {
        // Update existing rating
        const currentData = ratingDocSnap.data();
        const updatedRating = currentData.rating + stars + sentimentScore;
        const updatedTotalRating = currentData.totalRating + 6;

        await updateDoc(ratingDocRef, {
          rating: updatedRating,
          totalRating: updatedTotalRating,
        });
      } else {
        // Create new rating document
        await setDoc(ratingDocRef, {
          productId,
          rating: stars + sentimentScore,
          totalRating: 6,
        });
      }

      // Update local state
      setProductReviews((prev) => ({
        ...prev,
        [productId]: { stars, message },
      }));

      setProductRatings((prev) => {
        const currentRating = prev[productId]?.rating || 0;
        const currentTotalRating = prev[productId]?.totalRating || 0;
        return {
          ...prev,
          [productId]: {
            productId,
            rating: currentRating + stars + sentimentScore,
            totalRating: currentTotalRating + 6,
          },
        };
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className={`h-full rounded-md overflow-y-auto ${theme.mainTheme}`}>
      <div className="max-w-[99.5%] mx-auto my-4 md:my-1 h-full select-none p-4">
        <div className={`p-4 ${theme.mainTheme} rounded-lg mb-4`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${theme.colorText}`}>
              My Orders
            </h2>

            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={`appearance-none p-2 pr-8 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <i
                  className={`fas fa-chevron-down absolute right-3 top-3 ${theme.iconColor} pointer-events-none`}
                ></i>
              </div>

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
                      placeholder="Search by order ID or tailor..."
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
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color={theme.iconColor} size={50} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Orders List */}
            <div className={`lg:w-1/3 ${theme.mainTheme} rounded-xl p-4`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.colorText}`}>
                Order History ({filteredOrders.length})
              </h3>

              {filteredOrders.length === 0 ? (
                <div
                  className={`text-center py-8 ${theme.colorText} opacity-70`}
                >
                  <i className="fas fa-box-open text-4xl mb-3"></i>
                  <p>No orders found</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`mt-2 text-sm ${theme.colorText} underline`}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  {filteredOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedOrder?.id === order.id
                          ? `${theme.colorBg} border-l-4 border-blue-500`
                          : `${theme.hoverBg} bg-opacity-50`
                      } ${theme.colorBorder} border`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${theme.colorText}`}>
                            Order #{order.id.substring(0, 8)}
                          </p>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            {formatDate(order.placedOnDate)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            statusConfig[order.orderStatus]?.color ||
                            "bg-gray-500"
                          } text-white`}
                        >
                          {order.orderStatus === "paymentVerificationPending"
                            ? "Payment Pending"
                            : statusConfig[order.orderStatus]?.title ||
                              order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        {order.tailorDetails?.businessPictureUrl && (
                          <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                            <Image
                              src={order.tailorDetails.businessPictureUrl}
                              alt={order.tailorDetails.businessName}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              priority
                            />
                          </div>
                        )}
                        <p className={`text-sm ${theme.colorText} opacity-80`}>
                          {order.tailorDetails?.businessName ||
                            "Unknown Tailor"}
                        </p>
                      </div>
                      <p className={`mt-2 text-sm ${theme.colorText}`}>
                        PKR {order.totalAmount?.toLocaleString("en-PK") || "0"}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className={`lg:w-2/3 ${theme.mainTheme} rounded-xl p-6`}>
              {!selectedOrder ? (
                <div
                  className={`text-center py-12 ${theme.colorText} opacity-70`}
                >
                  <i className="fas fa-hand-pointer text-4xl mb-3"></i>
                  <p>Select an order to view details</p>
                </div>
              ) : selectedOrder.orderStatus === "cancelled" ? (
                <div className={`text-center py-12 ${theme.colorText}`}>
                  <div className="inline-block p-4 rounded-full bg-gray-200 dark:bg-gray-700 mb-4">
                    <i className="fas fa-ban text-4xl text-gray-500"></i>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Order Cancelled</h3>
                  <p className="mb-6">
                    This order was cancelled and is no longer active.
                  </p>
                  <div
                    className={`p-4 rounded-lg ${theme.colorBgSecondary} text-left`}
                  >
                    <h4 className="font-semibold mb-2">Order Summary</h4>
                    <p>Order ID: {selectedOrder.id}</p>
                    <p>Date: {formatDate(selectedOrder.placedOnDate)}</p>
                    <p>
                      Total: PKR{" "}
                      {selectedOrder.totalAmount?.toLocaleString("en-PK") ||
                        "0"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className={`text-xl font-bold ${theme.colorText}`}>
                        Order #{selectedOrder.id.substring(0, 8)}
                      </h3>
                      <p className={`text-sm ${theme.colorText} opacity-80`}>
                        Placed on {formatDate(selectedOrder.placedOnDate)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        statusConfig[selectedOrder.orderStatus]?.color ||
                        "bg-gray-500"
                      } text-white`}
                    >
                      {statusConfig[selectedOrder.orderStatus]?.title ||
                        selectedOrder.orderStatus}
                    </span>
                  </div>

                  {/* Order Timeline */}
                  <div className="mb-8">
                    <h4 className={`font-semibold mb-4 ${theme.colorText}`}>
                      Order Status
                    </h4>
                    <div className="relative">
                      {/* Timeline line */}
                      <div
                        className={`absolute left-4 top-0 h-full w-0.5 ${theme.colorBgSecondary}`}
                        aria-hidden="true"
                      ></div>

                      <div className="space-y-6">
                        {statusProgression.map((status, idx) => {
                          const isCompleted =
                            getStatusIndex(selectedOrder.orderStatus) >= idx;
                          const isCurrent =
                            selectedOrder.orderStatus === status;
                          const statusInfo = statusConfig[status];

                          return (
                            <motion.div
                              key={status}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="relative flex gap-4"
                            >
                              <div
                                className={`absolute left-4 top-4 h-6 w-6 rounded-full flex items-center justify-center ${
                                  isCompleted
                                    ? isCurrent
                                      ? "ring-4 ring-blue-300"
                                      : ""
                                    : `${theme.colorBgSecondary}`
                                } ${
                                  isCompleted
                                    ? statusInfo.color
                                    : `${theme.colorBorder} border-2`
                                }`}
                              >
                                {isCompleted ? (
                                  <i
                                    className={`fas fa-${statusInfo.icon} text-white text-xs`}
                                  ></i>
                                ) : (
                                  <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                                )}
                              </div>
                              <div
                                className={`flex-1 pt-2 pl-12 pb-6 rounded-lg ${
                                  isCurrent
                                    ? `${theme.hoverBg} bg-opacity-30`
                                    : ""
                                }`}
                              >
                                <h4
                                  className={`font-medium ${
                                    isCompleted
                                      ? theme.colorText
                                      : `${theme.colorText} opacity-70`
                                  }`}
                                >
                                  {statusInfo.title}
                                </h4>
                                <p
                                  className={`text-sm ${
                                    isCompleted
                                      ? `${theme.colorText} opacity-80`
                                      : `${theme.colorText} opacity-50`
                                  }`}
                                >
                                  {statusInfo.description}
                                </p>
                                {isCurrent && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`mt-2 p-2 text-sm rounded ${statusInfo.color} bg-opacity-20 text-white`}
                                  >
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Your order is currently at this stage
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Products */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                        Products (
                        {selectedOrder.itemCount ||
                          selectedOrder.products?.length ||
                          0}
                        )
                      </h4>
                      <div className="space-y-3">
                        {selectedOrder.products?.map((product, idx) => {
                          const productRating =
                            productRatings[product.productId];
                          const userReview = productReviews[product.productId];
                          const calculatedRating = productRating
                            ? (productRating.rating /
                                productRating.totalRating) *
                              5
                            : 0;

                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`flex flex-col gap-3 p-3 rounded-lg ${theme.colorBgSecondary}`}
                            >
                              <div className="flex gap-3">
                                <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                  <Image
                                    src={
                                      product.image ||
                                      "/images/default-product.png"
                                    }
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                    priority
                                  />
                                </div>
                                <div>
                                  <p
                                    className={`font-medium ${theme.colorText}`}
                                  >
                                    {product.name}
                                  </p>
                                  <p
                                    className={`text-sm ${theme.colorText} opacity-80`}
                                  >
                                    Qty: {product.quantity}
                                  </p>
                                  {product.tailorName && (
                                    <p
                                      className={`text-xs ${theme.colorText} opacity-70`}
                                    >
                                      By {product.tailorName}
                                    </p>
                                  )}
                                  {productRating && (
                                    <div className="flex items-center mt-1">
                                      <span className="text-yellow-500 text-xs">
                                        {"★".repeat(
                                          Math.floor(calculatedRating)
                                        )}
                                        {"☆".repeat(
                                          5 - Math.floor(calculatedRating)
                                        )}
                                      </span>
                                      <span className="text-xs ml-1 opacity-70">
                                        ({calculatedRating.toFixed(1)})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Review Section for Delivered Orders */}
                              {selectedOrder.orderStatus === "delivered" && (
                                <div className="mt-2">
                                  {userReview ? (
                                    <div
                                      className={`p-2 rounded ${theme.colorBg} border ${theme.colorBorder}`}
                                    >
                                      <div className="flex items-center mb-1">
                                        <span className="text-yellow-500 text-sm">
                                          {"★".repeat(userReview.stars)}
                                          {"☆".repeat(5 - userReview.stars)}
                                        </span>
                                      </div>
                                      <p
                                        className={`text-sm ${theme.colorText}`}
                                      >
                                        {userReview.message}
                                      </p>
                                    </div>
                                  ) : (
                                    <ProductReviewForm
                                      productId={product.productId}
                                      onSubmit={handleSubmitReview}
                                      isSubmitting={isSubmittingReview}
                                      theme={theme}
                                    />
                                  )}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery and Payment */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                        Delivery Information
                      </h4>
                      <div
                        className={`p-4 rounded-lg ${theme.colorBgSecondary} mb-4`}
                      >
                        <p className={`font-medium ${theme.colorText}`}>
                          {selectedOrder.deliveryAddress?.name}
                        </p>
                        <p className={`text-sm ${theme.colorText} opacity-80`}>
                          {selectedOrder.deliveryAddress?.streetAddress}
                        </p>
                        <p className={`text-sm ${theme.colorText} opacity-80`}>
                          {selectedOrder.deliveryAddress?.city},{" "}
                          {selectedOrder.deliveryAddress?.province}
                        </p>
                        <p className={`text-sm ${theme.colorText} opacity-80`}>
                          {selectedOrder.deliveryAddress?.postalCode}
                        </p>
                        <p
                          className={`text-sm ${theme.colorText} opacity-80 mt-2`}
                        >
                          <i className="fas fa-phone mr-2"></i>
                          {selectedOrder.deliveryAddress?.phone}
                        </p>
                        {selectedOrder.deliveryAddress
                          ?.deliveryInstructions && (
                          <div
                            className={`mt-3 pt-3 border-t ${theme.colorBorder}`}
                          >
                            <p
                              className={`text-sm font-medium ${theme.colorText}`}
                            >
                              Delivery Instructions:
                            </p>
                            <p
                              className={`text-sm ${theme.colorText} opacity-80`}
                            >
                              {
                                selectedOrder.deliveryAddress
                                  .deliveryInstructions
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                        Payment Details
                      </h4>
                      <div
                        className={`p-4 rounded-lg ${theme.colorBgSecondary}`}
                      >
                        <div className="flex justify-between mb-2">
                          <span className={`${theme.colorText} opacity-80`}>
                            Subtotal:
                          </span>
                          <span className={`${theme.colorText}`}>
                            PKR{" "}
                            {selectedOrder.totalAmount?.toLocaleString(
                              "en-PK"
                            ) || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className={`${theme.colorText} opacity-80`}>
                            Payment Method:
                          </span>
                          <span className={`${theme.colorText}`}>
                            {selectedOrder.paymentMethod || "N/A"}
                          </span>
                        </div>
                        {selectedOrder.paymentDetails?.transactionId && (
                          <div className="flex justify-between">
                            <span className={`${theme.colorText} opacity-80`}>
                              Transaction ID:
                            </span>
                            <span className={`${theme.colorText}`}>
                              {selectedOrder.paymentDetails.transactionId}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tailor Information */}
                  {selectedOrder.tailorDetails && (
                    <div className={`p-4 rounded-lg ${theme.colorBgSecondary}`}>
                      <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                        Tailor Information
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden">
                          <Image
                            src={selectedOrder.tailorDetails.businessPictureUrl}
                            alt={selectedOrder.tailorDetails.businessName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            priority
                          />
                        </div>
                        <div>
                          <p className={`font-medium ${theme.colorText}`}>
                            {selectedOrder.tailorDetails.businessName}
                          </p>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Working on your order
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductReviewForm = ({ productId, onSubmit, isSubmitting, theme }) => {
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (stars > 0 && message.trim().length >= 3) {
      onSubmit(productId, stars, message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={`block text-sm mb-1 ${theme.colorText}`}>
          Your Rating:
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStars(i)}
              className={`text-2xl focus:outline-none ${
                i <= stars ? "text-yellow-500" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={`block text-sm mb-1 ${theme.colorText}`}>
          Your Review:
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`w-full p-2 rounded ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} focus:outline-none focus:ring-1 focus:ring-blue-500`}
          rows={3}
          minLength={3}
          maxLength={250}
          required
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || stars === 0 || message.trim().length < 3}
        className={`px-4 py-2 rounded ${theme.colorBg} ${theme.colorText} ${theme.hoverBg} ${theme.hoverText} transition-colors disabled:opacity-50`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <ClipLoader size={16} color={theme.iconColor} className="mr-2" />
            Submitting...
          </span>
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  );
};

export default MyOrders;
