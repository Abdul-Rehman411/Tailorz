"use client";
import { useState, useEffect, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/utils/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import {
  FaLock,
  FaUser,
  FaPlus,
  FaCheck,
  FaTimes,
  FaShoppingBag,
  FaMoneyBillWave,
  FaWallet,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import Image from "next/image";
import UserContext from "@/utils/UserContext";
import ImageCropper from "@/components/ImageCropper";

const AdminDashboard = () => {
  const {
    theme,
    inputStyles,
    placeHolderStyles,
    setShowMessage,
    setPopUpMessageTrigger,
  } = useContext(UserContext);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Admin credentials (hardcoded)
  const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "123123",
  };

  // Product management state
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    material: "",
    gender: "Unisex",
    has3DTryOn: false,
    isActive: true,
    imageUrl: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  // Image cropper state
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Order management state
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");

  // Handle image cropped
  const handleImageCropped = useCallback((croppedImageUrl) => {
    setNewProduct((prev) => ({ ...prev, imageUrl: croppedImageUrl }));
    setCropperModalOpen(false);
  }, []);

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    setTimeout(() => {
      if (
        username === ADMIN_CREDENTIALS.username &&
        password === ADMIN_CREDENTIALS.password
      ) {
        setIsAuthenticated(true);
        localStorage.setItem("adminAuthenticated", "true");
      } else {
        setAuthError("Invalid username or password");
      }
      setIsLoading(false);
    }, 1000);
  };

  // Check auth status on load
  useEffect(() => {
    const authStatus = localStorage.getItem("adminAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      const q = query(
        collection(db, "OrdersManagement"),
        where("orderStatus", "==", "paymentVerificationPending")
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingOrders(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showAlert("error", "Failed to fetch pending orders");
    }
  };

  // Fetch pending payouts
  const fetchPendingPayouts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tailorWallet"));
      const wallets = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const payouts = [];
      for (const wallet of wallets) {
        if (wallet.transactions && wallet.transactions.length > 0) {
          wallet.transactions.forEach((tx, index) => {
            if (tx.type === "payOut" && tx.status === "pending") {
              payouts.push({
                ...tx,
                tailorId: wallet.tailorId,
                walletId: wallet.id,
                transactionIndex: index,
                bankDetails: {
                  bankName: wallet.bankName,
                  accountName: wallet.accountName,
                  accountNumber: wallet.accountNumber,
                },
              });
            }
          });
        }
      }

      setPendingPayouts(payouts);
    } catch (error) {
      console.error("Error fetching pending payouts:", error);
      showAlert("error", "Failed to fetch pending payouts");
    }
  };

  // Update payout status
  const updatePayoutStatus = async (walletId, transactionIndex, status) => {
    try {
      const walletRef = doc(db, "tailorWallet", walletId);
      const walletSnap = await getDoc(walletRef);

      if (!walletSnap.exists()) {
        showAlert("error", "Wallet not found");
        return;
      }

      const walletData = walletSnap.data();
      const updatedTransactions = [...walletData.transactions];

      if (!updatedTransactions[transactionIndex]) {
        showAlert("error", "Transaction not found");
        return;
      }

      // Create a new transaction object with updated status
      updatedTransactions[transactionIndex] = {
        ...updatedTransactions[transactionIndex],
        status,
        processedAt: new Date().toISOString(),
      };

      // Update balance if completing payout
      let newBalance = walletData.currentBalance || 0;
      if (status === "failed") {
        newBalance += updatedTransactions[transactionIndex].amount;
      }

      await updateDoc(walletRef, {
        transactions: updatedTransactions,
        currentBalance: newBalance,
        updatedAt: new Date().toISOString(),
      });

      showAlert(
        "success",
        `Payout ${status === "failed" ? "declined" : "approved"} successfully`
      );
      fetchPendingPayouts();
    } catch (error) {
      console.error("Error updating payout status:", error);
      showAlert("error", "Failed to update payout status");
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "predefinedProducts"));
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      showAlert("error", "Failed to fetch products");
    }
  };

  // Show alert notification
  const showAlert = (type, message) => {
    setShowMessage({
      type,
      message,
    });
    setPopUpMessageTrigger(true);
  };

  // Create user-tailor connection
  const createUserTailorConnection = async (userId, tailorId) => {
    try {
      await addDoc(collection(db, "userTailorConnections"), {
        userId,
        tailorId,
        timestamp: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error creating user-tailor connection:", error);
      return false;
    }
  };

  // Handle order verification
  const handleOrderVerification = async (orderId, action) => {
    try {
      const order = pendingOrders.find((o) => o.id === orderId);
      if (!order) {
        showAlert("error", "Order not found");
        return;
      }

      const orderRef = doc(db, "OrdersManagement", orderId);

      if (action === "approve") {
        // First create the user-tailor connection
        const connectionCreated = await createUserTailorConnection(
          order.userId,
          order.tailorId
        );

        if (!connectionCreated) {
          showAlert("error", "Failed to create user-tailor connection");
          return;
        }

        // Then update the order status
        await updateDoc(orderRef, {
          orderStatus: "paymentVerified",
          updatedAt: new Date().toISOString(),
        });

        showAlert(
          "success",
          "Payment verified and user-tailor connection created"
        );
      } else {
        await updateDoc(orderRef, {
          orderStatus: "paymentRejected",
          updatedAt: new Date().toISOString(),
        });
        showAlert("success", "Payment rejected");
      }

      fetchPendingOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      showAlert("error", "Failed to update order status");
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Image = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileExtension = file.name.split(".").pop();
      const fileName = `product-${Date.now()}.${fileExtension}`;
      const targetPath = "images/products";

      const response = await fetch("/api/imageUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: base64Image,
          fileName,
          targetPath,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image upload failed: ${errorText}`);
      }

      const { url } = await response.json();
      return "/" + url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file change
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setCropperModalOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error handling file upload:", error);
      showAlert("error", "Failed to process image");
    }
  };

  // Handle product submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newProduct.imageUrl) {
        throw new Error("Please upload an image first");
      }

      const productData = {
        ...newProduct,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "predefinedProducts"), productData);
      setNewProduct({
        name: "",
        category: "",
        material: "",
        gender: "Unisex",
        has3DTryOn: false,
        isActive: true,
        imageUrl: "",
      });
      fetchProducts();
      showAlert("success", "Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      showAlert("error", error.message);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date - handles both Firestore Timestamp and regular date strings
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    try {
      let date;
      if (dateValue.toDate) {
        // Handle Firestore Timestamp
        date = dateValue.toDate();
      } else if (typeof dateValue === "string") {
        // Handle ISO string
        date = new Date(dateValue);
      } else if (typeof dateValue === "number") {
        // Handle timestamp
        date = new Date(dateValue);
      } else {
        return "N/A";
      }

      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingOrders();
      fetchPendingPayouts();
      fetchProducts();
    }
  }, [isAuthenticated]);

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className={`w-full max-w-md ${theme.mainTheme} rounded-xl shadow-2xl overflow-hidden`}
        >
          <motion.div
            className={`p-6 text-center ${theme.colorPrimaryBg}`}
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <motion.h1
              className="text-2xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Admin Dashboard
            </motion.h1>
            <motion.p
              className="opacity-90 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Please sign in to continue
            </motion.p>
          </motion.div>

          <motion.form
            onSubmit={handleLogin}
            className="p-6 space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className={theme.iconColor} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`${inputStyles} pl-10`}
                  placeholder=" "
                  required
                />
                <label className={`${placeHolderStyles} ml-9`}>Username</label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className={theme.iconColor} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputStyles} pl-10`}
                  placeholder=" "
                  required
                />
                <label className={`${placeHolderStyles} ml-9`}>Password</label>
              </div>
            </div>

            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-3 rounded-lg bg-red-100 text-red-700`}>
                    {authError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg ${theme.colorPrimaryBg} text-white font-medium flex items-center justify-center`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <ClipLoader size={20} color="#ffffff" className="mr-2" />
              ) : (
                <FaLock className="mr-2" />
              )}
              Sign In
            </motion.button>
          </motion.form>
        </motion.div>
      </motion.div>
    );
  }

  // Admin dashboard
  return (
    <div className={`h-full overflow-auto ${theme.mainTheme}`}>
      {/* Image Cropper Modal */}
      <ImageCropper
        aspectRatio={1 / 1}
        onCropComplete={handleImageCropped}
        showModal={cropperModalOpen}
        setShowModal={setCropperModalOpen}
        imageSrc={imageToCrop}
        modalTitle="Product Image Cropper"
        instructionText="Adjust your product image to fit within the square crop area. This will be used as your product thumbnail."
      />

      {/* Header */}
      <motion.header
        className="shadow-sm"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${theme.colorText}`}>
            Admin Dashboard
          </h1>
          <motion.button
            onClick={() => {
              setIsAuthenticated(false);
              localStorage.removeItem("adminAuthenticated");
            }}
            className={`px-4 py-2 rounded-lg ${theme.colorBgSecondary} ${theme.colorText} hover:bg-red-500 hover:text-white transition`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          <motion.button
            onClick={() => setActiveTab("orders")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === "orders"
                ? `${theme.colorText} border-b-2 border-blue-500`
                : `${theme.colorText} opacity-70 hover:opacity-100`
            }`}
          >
            <FaMoneyBillWave className="mr-2" />
            Pending Orders
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("payouts")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === "payouts"
                ? `${theme.colorText} border-b-2 border-blue-500`
                : `${theme.colorText} opacity-70 hover:opacity-100`
            }`}
          >
            <FaWallet className="mr-2" />
            Pending Payouts
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("products")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === "products"
                ? `${theme.colorText} border-b-2 border-blue-500`
                : `${theme.colorText} opacity-70 hover:opacity-100`
            }`}
          >
            <FaShoppingBag className="mr-2" />
            Product Management
          </motion.button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={`text-xl font-semibold mb-4 ${theme.colorText}`}>
              Payment Verification Pending
            </h2>

            {pendingOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-lg shadow p-6 text-center ${theme.colorBg}`}
              >
                <p className={`${theme.colorText}`}>
                  No orders pending verification
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {pendingOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg shadow overflow-hidden ${theme.colorBg}`}
                  >
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Transaction ID
                          </p>
                          <p className={`font-medium ${theme.colorText}`}>
                            {order.paymentDetails?.transactionId || "N/A"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Amount
                          </p>
                          <p
                            className={`font-medium text-lg ${theme.colorText}`}
                          >
                            ${order.totalAmount?.toFixed(2) || "0.00"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            User ID
                          </p>
                          <p className={`font-medium ${theme.colorText}`}>
                            {order.userId || "N/A"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Tailor ID
                          </p>
                          <p className={`font-medium ${theme.colorText}`}>
                            {order.tailorId || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex space-x-3">
                        <motion.button
                          onClick={() =>
                            handleOrderVerification(order.id, "approve")
                          }
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                        >
                          <FaCheck className="mr-2" />
                          Approve
                        </motion.button>
                        <motion.button
                          onClick={() =>
                            handleOrderVerification(order.id, "reject")
                          }
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                        >
                          <FaTimes className="mr-2" />
                          Reject
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Payouts Tab */}
        {activeTab === "payouts" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className={`text-xl font-semibold mb-4 ${theme.colorText}`}>
              Pending Payout Requests
            </h2>

            {pendingPayouts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-lg shadow p-6 text-center ${theme.colorBg}`}
              >
                <p className={`${theme.colorText}`}>
                  No pending payout requests
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                {pendingPayouts.map((payout, index) => (
                  <motion.div
                    key={`${payout.walletId}-${index}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-lg shadow overflow-hidden ${theme.colorBg}`}
                  >
                    <div className="p-6">
                      <div className="space-y-4">
                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Tailor ID
                          </p>
                          <p className={`font-medium ${theme.colorText}`}>
                            {payout.tailorId || "N/A"}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Amount
                          </p>
                          <p className={`font-medium text-lg text-blue-500`}>
                            {formatCurrency(payout.amount)}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`text-sm ${theme.colorText} opacity-80`}
                          >
                            Request Date
                          </p>
                          <p className={`font-medium ${theme.colorText}`}>
                            {formatDate(payout.date)}
                          </p>
                        </div>

                        <div
                          className={`p-4 rounded-lg ${theme.colorBgSecondary}`}
                        >
                          <h4
                            className={`text-sm font-semibold mb-2 ${theme.colorText}`}
                          >
                            Bank Details
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <p
                                className={`text-xs ${theme.colorText} opacity-70`}
                              >
                                Bank Name
                              </p>
                              <p className={`text-sm ${theme.colorText}`}>
                                {payout.bankDetails?.bankName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p
                                className={`text-xs ${theme.colorText} opacity-70`}
                              >
                                Account Name
                              </p>
                              <p className={`text-sm ${theme.colorText}`}>
                                {payout.bankDetails?.accountName || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p
                                className={`text-xs ${theme.colorText} opacity-70`}
                              >
                                Account Number
                              </p>
                              <p className={`text-sm ${theme.colorText}`}>
                                {payout.bankDetails?.accountNumber || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex space-x-3">
                        <motion.button
                          onClick={() =>
                            updatePayoutStatus(
                              payout.walletId,
                              payout.transactionIndex,
                              "completed"
                            )
                          }
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                        >
                          <FaCheck className="mr-2" />
                          Mark as Completed
                        </motion.button>
                        <motion.button
                          onClick={() =>
                            updatePayoutStatus(
                              payout.walletId,
                              payout.transactionIndex,
                              "failed"
                            )
                          }
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                        >
                          <FaTimes className="mr-2" />
                          Mark as Failed
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Product List */}
            <motion.div
              className="lg:col-span-2"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ type: "spring" }}
            >
              <div
                className={`rounded-xl shadow overflow-hidden ${theme.colorBg}`}
              >
                <div className="p-6">
                  <h2
                    className={`text-xl font-semibold mb-4 ${theme.colorText}`}
                  >
                    Products
                  </h2>

                  {products.length === 0 ? (
                    <p className={`${theme.colorText}`}>No products found</p>
                  ) : (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.1 }}
                    >
                      {products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center p-4 rounded-lg ${theme.colorBgSecondary} hover:${theme.colorBgHover}`}
                        >
                          <motion.div
                            className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100"
                            whileHover={{ scale: 1.05 }}
                          >
                            {product.imageUrl && (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            )}
                          </motion.div>

                          <div className="ml-4 flex-1">
                            <h3 className={`font-medium ${theme.colorText}`}>
                              {product.name}
                            </h3>
                            <p
                              className={`text-sm ${theme.colorText} opacity-80`}
                            >
                              {product.category}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${theme.colorBgTertiary}`}
                              >
                                {product.gender}
                              </span>
                              {product.has3DTryOn && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  3D Try-On
                                </span>
                              )}
                              {product.isActive ? (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Active
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Add Product Form */}
            <motion.div
              initial={{ x: 20 }}
              animate={{ x: 0 }}
              transition={{ type: "spring" }}
            >
              <div
                className={`rounded-xl shadow overflow-hidden ${theme.colorBg}`}
              >
                <div className="p-6">
                  <h2
                    className={`text-xl font-semibold mb-4 flex items-center ${theme.colorText}`}
                  >
                    <FaPlus className="mr-2" />
                    Add New Product
                  </h2>

                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                        className={`${inputStyles}`}
                        placeholder=" "
                        required
                      />
                      <label className={`${placeHolderStyles}`}>
                        Product Name
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        name="category"
                        value={newProduct.category}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            category: e.target.value,
                          })
                        }
                        className={`${inputStyles}`}
                        placeholder=" "
                        required
                      />
                      <label className={`${placeHolderStyles}`}>Category</label>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        name="material"
                        value={newProduct.material}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            material: e.target.value,
                          })
                        }
                        className={`${inputStyles}`}
                        placeholder=" "
                      />
                      <label className={`${placeHolderStyles}`}>
                        Material (optional)
                      </label>
                    </div>

                    <div className="relative">
                      <label className={`block mb-2 ${theme.colorText}`}>
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={newProduct.gender}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            gender: e.target.value,
                          })
                        }
                        className={`${inputStyles}`}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Kids">Kids</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="has3DTryOn"
                          name="has3DTryOn"
                          checked={newProduct.has3DTryOn}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              has3DTryOn: e.target.checked,
                            })
                          }
                          className={`h-4 w-4 ${theme.colorBorder} rounded`}
                        />
                        <label
                          htmlFor="has3DTryOn"
                          className={`ml-2 block text-sm ${theme.colorText}`}
                        >
                          3D Try-On
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={newProduct.isActive}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              isActive: e.target.checked,
                            })
                          }
                          className={`h-4 w-4 ${theme.colorBorder} rounded`}
                        />
                        <label
                          htmlFor="isActive"
                          className={`ml-2 block text-sm ${theme.colorText}`}
                        >
                          Active
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className={`block mb-2 ${theme.colorText}`}>
                        Product Image
                      </label>
                      {newProduct.imageUrl ? (
                        <div className="relative">
                          {/* Updated preview container with 1:1 aspect ratio */}
                          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={newProduct.imageUrl}
                              alt="Product preview"
                              width={300}
                              height={300}
                              className="object-cover w-full h-full"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <motion.button
                            type="button"
                            onClick={() =>
                              setNewProduct({ ...newProduct, imageUrl: "" })
                            }
                            className={`absolute top-2 right-2 p-1 rounded-full ${theme.colorBgSecondary} ${theme.colorText} hover:bg-red-500 hover:text-white`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FaTimes />
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                          <label
                            className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer ${theme.colorBgSecondary} hover:${theme.colorBgHover}`}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploading ? (
                                <ClipLoader size={24} color={theme.iconColor} />
                              ) : (
                                <>
                                  <svg
                                    className="w-8 h-8 mb-4 text-gray-500"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                  >
                                    <path
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                  </svg>
                                  <p
                                    className={`mb-2 text-sm ${theme.colorText}`}
                                  >
                                    <span className="font-semibold">
                                      Click to upload
                                    </span>
                                  </p>
                                </>
                              )}
                            </div>
                            <input
                              id="dropzone-file"
                              type="file"
                              className="hidden"
                              onChange={handleFileChange}
                              accept="image/*"
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={!newProduct.imageUrl || isUploading}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-2 px-4 rounded-lg ${theme.colorPrimaryBg} text-white font-medium flex items-center justify-center disabled:opacity-50`}
                    >
                      {isUploading ? (
                        <ClipLoader
                          size={20}
                          color="#ffffff"
                          className="mr-2"
                        />
                      ) : (
                        <FaPlus className="mr-2" />
                      )}
                      Add Product
                    </motion.button>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
