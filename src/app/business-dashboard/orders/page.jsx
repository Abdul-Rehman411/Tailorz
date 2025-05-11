"use client";
import { useState, useEffect, useContext, useRef } from "react";
import { db } from "@/utils/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import UserContext from "@/utils/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import Image from "next/image";
import SimpleButton from "@/components/SimpleButton";
import DialogBox from "@/components/DialogBox";

const TailorOrdersManagement = () => {
  const { theme, userData, setShowMessage, setPopUpMessageTrigger } =
    useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);

  // Order status configuration
  const statusConfig = {
    paymentVerified: {
      title: "Payment Verified",
      icon: "check-circle",
      color: "bg-green-500",
      description: "Payment confirmed, ready to start",
      nextStatus: "startedStitching",
      nextAction: "Start Stitching",
    },
    startedStitching: {
      title: "Stitching Started",
      icon: "cut",
      color: "bg-blue-500",
      description: "Working on the order",
      nextStatus: "onDelivery",
      nextAction: "Ready for Delivery",
    },
    onDelivery: {
      title: "On Delivery",
      icon: "truck",
      color: "bg-purple-500",
      description: "Order is with delivery service",
      nextStatus: "delivered",
      nextAction: "Mark as Delivered",
    },
    delivered: {
      title: "Delivered",
      icon: "box-open",
      color: "bg-green-600",
      description: "Order has been delivered",
      nextStatus: null,
      nextAction: null,
    },
    cancelled: {
      title: "Cancelled",
      icon: "ban",
      color: "bg-gray-500",
      description: "Order was cancelled",
      nextStatus: null,
      nextAction: null,
    },
  };

  // All possible status filters
  const statusFilters = [
    { value: "all", label: "All Orders", icon: "list" },
    {
      value: "paymentVerified",
      label: "Payment Verified",
      icon: "check-circle",
    },
    { value: "startedStitching", label: "Stitching Started", icon: "cut" },
    { value: "onDelivery", label: "On Delivery", icon: "truck" },
    { value: "delivered", label: "Delivered", icon: "box-open" },
    { value: "cancelled", label: "Cancelled", icon: "ban" },
  ];

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First", icon: "arrow-down" },
    { value: "oldest", label: "Oldest First", icon: "arrow-up" },
  ];

  // Update tailor wallet when order is delivered
  const updateTailorWallet = async (tailorId, amount) => {
    try {
      const walletRef = doc(db, "tailorWallet", tailorId);
      const walletSnap = await getDoc(walletRef);

      const transaction = {
        type: "payIn",
        amount: amount,
        date: new Date().toISOString(),
        status: "completed"
      };

      if (walletSnap.exists()) {
        // Update existing wallet
        const currentBalance = walletSnap.data().currentBalance || 0;
        await updateDoc(walletRef, {
          currentBalance: currentBalance + amount,
          transactions: [...walletSnap.data().transactions, transaction],
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new wallet
        await setDoc(walletRef, {
          tailorId,
          bankName:"",
          accountName:"",
          accountNumber:"",
          currentBalance: amount,
          transactions: [transaction],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating tailor wallet:", error);
      throw error;
    }
  };

  // Fetch and sort orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData?.bId) return;

      setLoading(true);
      try {
        let q;
        if (statusFilter === "all") {
          q = query(
            collection(db, "OrdersManagement"),
            where("tailorId", "==", userData.bId),
            where("orderStatus", "not-in", [
              "inCart",
              "paymentVerificationPending",
              "paymentRejected",
            ])
          );
        } else {
          q = query(
            collection(db, "OrdersManagement"),
            where("tailorId", "==", userData.bId),
            where("orderStatus", "==", statusFilter)
          );
        }

        const querySnapshot = await getDocs(q);
        let ordersData = [];

        for (const orderDoc of querySnapshot.docs) {
          const orderData = orderDoc.data();

          let userDetails = {};
          if (orderData.userId) {
            try {
              const userDocRef = doc(db, "users", orderData.userId);
              const userDocSnap = await getDoc(userDocRef);

              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                userDetails = {
                  fullName: userData.fullName,
                  profilePictureUrl:
                    userData.profilePictureUrl || "/images/default-user.png",
                };
              }
            } catch (error) {
              console.error("Error fetching user details:", error);
            }
          }

          ordersData.push({
            id: orderDoc.id,
            ...orderData,
            userDetails,
            placedOnDate: orderData.placedOnDate || orderData.updatedAt,
          });
        }

        // Sort orders by date
        ordersData.sort((a, b) => {
          const dateA = new Date(a.placedOnDate);
          const dateB = new Date(b.placedOnDate);
          return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        setOrders(ordersData);

        // Select the first order by default if available
        if (ordersData.length > 0 && !selectedOrder) {
          setSelectedOrder(ordersData[0]);
        } else {
          setSelectedOrder(null);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setShowMessage({
          type: "danger",
          message: "Failed to load orders. Please try again.",
        });
        setPopUpMessageTrigger(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData?.bId, statusFilter, sortOrder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(event.target)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle search bar
  const toggleSearch = () => {
    setSearchActive(!searchActive);
    if (searchActive) {
      setSearchQuery("");
    }
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderStatus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userDetails?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date =
        typeof dateString === "object" && dateString.toDate
          ? dateString.toDate()
          : new Date(dateString);

      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

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

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const orderRef = doc(db, "OrdersManagement", orderId);
      await updateDoc(orderRef, {
        orderStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // If status is being updated to "delivered", update the tailor's wallet
      if (newStatus === "delivered") {
        const order = orders.find(o => o.id === orderId);
        if (order && order.totalAmount) {
          await updateTailorWallet(userData.bId, order.totalAmount);
        }
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderStatus: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          updatedAt: new Date().toISOString(),
        }));
      }

      setShowMessage({
        type: "success",
        message: "Order status updated successfully!",
      });
      setPopUpMessageTrigger(true);
    } catch (error) {
      console.error("Error updating order status:", error);
      setShowMessage({
        type: "danger",
        message: "Failed to update order status. Please try again.",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setUpdatingStatus(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <div className={`h-full overflow-y-auto ${theme.mainTheme}`}>
      <div className="max-w-[99.5%] mx-auto my-4 md:my-1 h-full select-none p-4">
        <div className={`p-4 ${theme.mainTheme} rounded-lg mb-4`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${theme.colorText}`}>
              Orders Management
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
                      placeholder="Search orders..."
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
              <div className="relative">
                <div ref={dropdownButtonRef}>
                  <SimpleButton
                    btnText={
                      <>
                        <i className="fas fa-filter mr-2"></i>
                        Filters
                      </>
                    }
                    type="default"
                    onClick={() => setShowFilters(!showFilters)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {statusFilter !== "all" && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`px-3 py-1 text-xs rounded-full ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} flex items-center`}
              >
                <i
                  className={`fas fa-${
                    statusFilters.find((f) => f.value === statusFilter)?.icon
                  } mr-1`}
                ></i>
                {statusFilters.find((f) => f.value === statusFilter)?.label}
              </motion.span>
            )}
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
            {(statusFilter !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className={`ml-2 text-xs underline ${theme.colorText} hover:text-blue-500 flex items-center`}
              >
                <i className="fas fa-broom mr-1"></i>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute right-[20px] mt-2 w-64 ${theme.mainTheme} rounded-xl shadow-xl border ${theme.colorBorder} z-50 overflow-y-auto max-h-[80vh]`}
            >
              <div className="p-4">
                <h3
                  className={`font-bold text-lg mb-3 ${theme.colorText} flex items-center`}
                >
                  <i className="fas fa-sliders-h mr-2"></i>
                  Filter & Sort
                </h3>

                {/* Status Filter Section */}
                <div className="mb-4">
                  <h4
                    className={`text-sm font-semibold mb-2 ${theme.colorText} opacity-80 flex items-center`}
                  >
                    <i className="fas fa-tag mr-2"></i>
                    Filter by Status
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {statusFilters.map((filter) => (
                      <motion.button
                        key={filter.value}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setStatusFilter(filter.value);
                        }}
                        className={`p-2 rounded-lg flex items-center justify-center text-sm ${
                          statusFilter === filter.value
                            ? `${theme.colorPrimaryBg} ${theme.colorPrimaryText}`
                            : `${theme.colorBg} ${theme.colorText}`
                        } border ${theme.colorBorder}`}
                      >
                        <i className={`fas fa-${filter.icon} mr-2`}></i>
                        {filter.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Sort Section */}
                <div>
                  <h4
                    className={`text-sm font-semibold mb-2 ${theme.colorText} opacity-80 flex items-center`}
                  >
                    <i className="fas fa-sort-amount-down mr-2"></i>
                    Sort by Date
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSortOrder(option.value);
                        }}
                        className={`p-2 rounded-lg flex items-center justify-center text-sm ${
                          sortOrder === option.value
                            ? `${theme.colorPrimaryBg} ${theme.colorPrimaryText}`
                            : `${theme.colorBg} ${theme.colorText}`
                        } border ${theme.colorBorder}`}
                      >
                        <i className={`fas fa-${option.icon} mr-2`}></i>
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div
                className={`p-3 border-t ${theme.colorBorder} flex justify-end`}
              >
                <SimpleButton
                  btnText="Close"
                  type="simple"
                  onClick={() => setShowFilters(false)}
                  small
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ClipLoader color={theme.iconColor} size={50} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Orders List */}
            <div className={`lg:w-1/3 ${theme.mainTheme} rounded-xl p-4`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.colorText}`}>
                {statusFilter === "all"
                  ? "All Orders"
                  : statusFilters.find((f) => f.value === statusFilter)
                      ?.label}{" "}
                ({filteredOrders.length})
              </h3>

              {filteredOrders.length === 0 ? (
                <div
                  className={`text-center py-8 ${theme.colorText} opacity-70`}
                >
                  <i className="fas fa-box-open text-4xl mb-3"></i>
                  <p>No orders found</p>
                  {(searchQuery || statusFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                      className={`mt-2 text-sm ${theme.colorText} underline`}
                    >
                      Clear filters
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
                          {statusConfig[order.orderStatus]?.title ||
                            order.orderStatus}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <p className={`text-sm ${theme.colorText} opacity-80`}>
                          {order.deliveryAddress?.name || "Customer"}
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
              {filteredOrders.length === 0 ? (
                <div
                  className={`text-center py-12 ${theme.colorText} opacity-70`}
                >
                  <i className="fas fa-box-open text-4xl mb-3"></i>
                  <p>No orders to display</p>
                </div>
              ) : !selectedOrder ? (
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

                  {/* Current Status Card */}
                  <div
                    className={`p-4 rounded-lg mb-6 ${
                      theme.colorBgSecondary
                    } border-l-4 ${
                      statusConfig[selectedOrder.orderStatus]?.color ||
                      "border-gray-500"
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-full mr-3 ${
                          statusConfig[selectedOrder.orderStatus]?.color ||
                          "bg-gray-500"
                        }`}
                      >
                        <i
                          className={`fas fa-${
                            statusConfig[selectedOrder.orderStatus]?.icon ||
                            "info-circle"
                          } text-white`}
                        ></i>
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {statusConfig[selectedOrder.orderStatus]?.title ||
                            selectedOrder.orderStatus}
                        </h4>
                        <p className="text-sm opacity-80">
                          {statusConfig[selectedOrder.orderStatus]
                            ?.description || "Current order status"}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex justify-between">
                      {/* Only show cancel button if status is paymentVerified */}
                      {selectedOrder.orderStatus === "paymentVerified" && (
                        <SimpleButton
                          btnText={
                            updatingStatus ? (
                              <ClipLoader size={16} color="white" />
                            ) : (
                              <>
                                <i className="fas fa-ban mr-2"></i>
                                Cancel Order
                              </>
                            )
                          }
                          type="danger"
                          onClick={() => setShowCancelDialog(true)}
                          disabled={updatingStatus}
                        />
                      )}

                      {statusConfig[selectedOrder.orderStatus]?.nextAction && (
                        <SimpleButton
                          btnText={
                            updatingStatus ? (
                              <ClipLoader size={16} color="white" />
                            ) : (
                              statusConfig[selectedOrder.orderStatus]
                                ?.nextAction
                            )
                          }
                          type="primary"
                          onClick={() =>
                            updateOrderStatus(
                              selectedOrder.id,
                              statusConfig[selectedOrder.orderStatus]
                                ?.nextStatus
                            )
                          }
                          disabled={updatingStatus}
                        />
                      )}
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
                        {selectedOrder.products?.map((product, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex gap-3 p-3 rounded-lg ${theme.colorBgSecondary}`}
                          >
                            <div className="relative w-16 h-16 rounded-md overflow-hidden">
                              <Image
                                src={
                                  product.image || "/images/default-product.png"
                                }
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                priority
                              />
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${theme.colorText}`}>
                                {product.name}
                              </p>
                              <p
                                className={`text-sm ${theme.colorText} opacity-80`}
                              >
                                Qty: {product.quantity}
                              </p>

                              {/* Customization Link Button */}
                              {product.customizedProductLink && (
                                <div className="mt-2">
                                  <SimpleButton
                                    btnText={
                                      <>
                                        <i className="fas fa-external-link-alt mr-2"></i>
                                        View Customization
                                      </>
                                    }
                                    type="secondary"
                                    onClick={() =>
                                      window.open(
                                        product.customizedProductLink,
                                        "_blank"
                                      )
                                    }
                                    small
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Customer and Delivery */}
                    <div>
                      <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                        Customer Information
                      </h4>
                      <div
                        className={`p-4 rounded-lg ${theme.colorBgSecondary} mb-4`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <p className={`font-medium ${theme.colorText}`}>
                            Name:{" "}
                            {selectedOrder.deliveryAddress?.name || "Customer"}
                          </p>
                        </div>

                        <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                          Delivery Information
                        </h4>
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

                      {/* Measurements Button */}
                      <div className="mb-4">
                        <SimpleButton
                          btnText={
                            <>
                              <i className="fas fa-ruler-combined mr-2"></i>
                              See Measurements
                            </>
                          }
                          type="secondary"
                          onClick={() => {
                            window.open(`/user?share=${selectedOrder.userId}`, '_blank');
                          }}
                          fullWidth
                        />
                      </div>

                      {/* Payment Summary */}
                      <div
                        className={`p-4 rounded-lg ${theme.colorBgSecondary}`}
                      >
                        <h4 className={`font-semibold mb-3 ${theme.colorText}`}>
                          Order Summary
                        </h4>
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
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <DialogBox
        showDialog={showCancelDialog}
        setShowDialog={setShowCancelDialog}
        title="Confirm Cancellation"
        type="danger"
        body="Are you sure you want to cancel this order? This action cannot be undone."
        buttons={[
          {
            label: "Cancel Order",
            onClick: () => updateOrderStatus(selectedOrder?.id, "cancelled"),
            type: "danger",
          },
        ]}
      />
    </div>
  );
};

export default TailorOrdersManagement;