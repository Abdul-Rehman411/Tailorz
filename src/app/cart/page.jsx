"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/utils/firebaseConfig";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import Image from "next/image";
import UserContext from "@/utils/UserContext";
import SimpleButton from "@/components/SimpleButton";
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaWallet,
  FaReceipt,
  FaSpinner,
} from "react-icons/fa";
import { RiSecurePaymentFill } from "react-icons/ri";

const CartPage = () => {
  const {
    theme,
    userData,
    setShowMessage,
    setPopUpMessageTrigger,
    inputStyles,
    placeHolderStyles,
  } = useContext(UserContext);
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("details"); // 'details' or 'payment'
  const [checkoutData, setCheckoutData] = useState({
    name: "",
    phone: "",
    email: "",
    streetAddress: "",
    city: "",
    district: "",
    province: "",
    postalCode: "",
    country: "Pakistan",
    deliveryInstructions: "",
  });
  const [paymentData, setPaymentData] = useState({
    method: "easypaisa",
    transactionId: "",
  });

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      if (!userData?.uid) {
        setLoading(false);
        return;
      }

      try {
        const ordersCollection = collection(db, "OrdersManagement");
        const cartQuery = query(
          ordersCollection,
          where("userId", "==", userData.uid),
          where("orderStatus", "==", "inCart")
        );
        const querySnapshot = await getDocs(cartQuery);

        if (!querySnapshot.empty) {
          const cartDoc = querySnapshot.docs[0];
          setCart({ id: cartDoc.id, ...cartDoc.data() });

          // Pre-fill checkout data if available
          if (cartDoc.data().deliveryAddress) {
            setCheckoutData((prev) => ({
              ...prev,
              ...cartDoc.data().deliveryAddress,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        setShowMessage({
          type: "error",
          message: "Failed to load cart. Please try again.",
        });
        setPopUpMessageTrigger(true);
      }
      setLoading(false);
    };

    fetchCart();
  }, [setPopUpMessageTrigger, setShowMessage, userData.uid]);

  // Update quantity in cart
  const updateQuantity = async (productId, newQuantity) => {
    if (!cart || newQuantity < 1 || newQuantity > 10) return;

    setUpdating(true);
    try {
      const cartRef = doc(db, "OrdersManagement", cart.id);
      const updatedProducts = cart.products.map((product) =>
        product.productId === productId
          ? { ...product, quantity: newQuantity }
          : product
      );

      const totalAmount = updatedProducts.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );

      await updateDoc(cartRef, {
        products: updatedProducts,
        totalAmount,
        itemCount: updatedProducts.reduce((sum, p) => sum + p.quantity, 0),
      });

      setCart({
        ...cart,
        products: updatedProducts,
        totalAmount,
        itemCount: updatedProducts.reduce((sum, p) => sum + p.quantity, 0),
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      setShowMessage({
        type: "error",
        message: "Failed to update quantity. Please try again.",
      });
      setPopUpMessageTrigger(true);
    }
    setUpdating(false);
  };

  // Remove item from cart
  const removeItem = async (productId) => {
    if (!cart) return;

    setRemoving(productId);
    try {
      const cartRef = doc(db, "OrdersManagement", cart.id);
      const productToRemove = cart.products.find(
        (p) => p.productId === productId
      );

      if (!productToRemove) return;

      const updatedProducts = cart.products.filter(
        (p) => p.productId !== productId
      );

      // If last item is being removed, delete the cart document
      if (updatedProducts.length === 0) {
        await updateDoc(cartRef, {
          products: [],
          totalAmount: 0,
          itemCount: 0,
        });
        setCart({
          ...cart,
          products: [],
          totalAmount: 0,
          itemCount: 0,
        });
      } else {
        const totalAmount = updatedProducts.reduce(
          (sum, product) => sum + product.price * product.quantity,
          0
        );

        await updateDoc(cartRef, {
          products: arrayRemove(productToRemove),
          totalAmount,
          itemCount: updatedProducts.reduce((sum, p) => sum + p.quantity, 0),
        });

        setCart({
          ...cart,
          products: updatedProducts,
          totalAmount,
          itemCount: updatedProducts.reduce((sum, p) => sum + p.quantity, 0),
        });
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setShowMessage({
        type: "error",
        message: "Failed to remove item. Please try again.",
      });
      setPopUpMessageTrigger(true);
    }
    setRemoving(null);
  };

  // Handle checkout form changes
  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;
    setCheckoutData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle payment form changes
  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate checkout details
  const validateCheckoutDetails = () => {
    const requiredFields = [
      "name",
      "phone",
      "streetAddress",
      "city",
      "district",
      "province",
    ];
    const missingFields = requiredFields.filter(
      (field) => !checkoutData[field]?.trim()
    );

    if (missingFields.length > 0) {
      setShowMessage({
        type: "error",
        message: `Please fill in all required fields: ${missingFields.join(
          ", "
        )}`,
      });
      setPopUpMessageTrigger(true);
      return false;
    }
    return true;
  };

  // Save delivery address and proceed to payment
  const proceedToPayment = async () => {
    if (!cart || cart.products.length === 0) return;
    if (!validateCheckoutDetails()) return;

    try {
      // Update cart with delivery address
      const cartRef = doc(db, "OrdersManagement", cart.id);
      await updateDoc(cartRef, {
        deliveryAddress: {
          name: checkoutData.name,
          phone: checkoutData.phone,
          email: checkoutData.email,
          streetAddress: checkoutData.streetAddress,
          city: checkoutData.city,
          district: checkoutData.district,
          province: checkoutData.province,
          postalCode: checkoutData.postalCode,
          country: checkoutData.country,
          deliveryInstructions: checkoutData.deliveryInstructions,
        },
      });

      setCheckoutStep("payment");
    } catch (error) {
      console.error("Error updating delivery address:", error);
      setShowMessage({
        type: "error",
        message: "Failed to proceed to payment. Please try again.",
      });
      setPopUpMessageTrigger(true);
    }
  };

  // Complete payment
  const completePayment = async () => {
    if (!paymentData.transactionId) {
      setShowMessage({
        type: "error",
        message: "Please enter your transaction ID",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    try {
      const cartRef = doc(db, "OrdersManagement", cart.id);
      await updateDoc(cartRef, {
        orderStatus: "paymentVerificationPending",
        paymentMethod: paymentData.method,
        paymentDetails: {
          transactionId: paymentData.transactionId,
          amount:
            cart.totalAmount >= 5000
              ? cart.totalAmount
              : cart.totalAmount + 300,
          timestamp: new Date().toISOString(),
        },
      });

      setShowMessage({
        type: "success",
        message: "Order placed! - Payment under verification.",
      });
      setPopUpMessageTrigger(true);
      router.push("/user?tab=orders");
    } catch (error) {
      console.error("Error completing payment:", error);
      setShowMessage({
        type: "error",
        message: "Failed to complete payment. Please try again.",
      });
      setPopUpMessageTrigger(true);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"
          ></motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`mt-4 text-lg ${theme.colorText}`}
          >
            Loading your cart...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!userData?.uid) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen p-4 ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md text-center"
        >
          <h2 className={`text-2xl font-bold mb-4 ${theme.colorText}`}>
            Your Cart is Empty
          </h2>
          <p className={`mb-6 ${theme.colorText} opacity-80`}>
            Please login to view your cart or add items to your cart.
          </p>
          <div className="flex gap-4 justify-center">
            <SimpleButton
              btnText="Login"
              type="primary"
              onClick={() => router.push("/login")}
            />
            <SimpleButton
              btnText="Continue Shopping"
              type="secondary"
              onClick={() => router.push("/market")}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!cart || cart.products.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen p-4 ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md text-center"
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative w-40 h-40 mx-auto mb-6"
          >
            <Image
              src="/images/assets/empty-cart.webp"
              alt="Empty Cart"
              fill
              className="object-contain"
            />
          </motion.div>
          <h2 className={`text-2xl font-bold mb-4 ${theme.colorText}`}>
            Your Cart is Empty
          </h2>
          <p className={`mb-6 ${theme.colorText} opacity-80`}>
            Looks like you haven&apos;t added any items to your cart yet. Start
            shopping to add some!
          </p>
          <SimpleButton
            btnText="Continue Shopping"
            type="primary"
            fullWidth
            onClick={() => router.push("/market")}
          />
        </motion.div>
      </div>
    );
  }

  const totalAmount =
    cart.totalAmount >= 5000 ? cart.totalAmount : cart.totalAmount + 300;

  return (
    <div className={`h-full overflow-auto ${theme.mainTheme} pb-20`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className={`flex items-center ${theme.colorText} hover:text-blue-500 transition-colors`}
          >
            <FaArrowLeft className="mr-2" />
            Back
          </motion.button>
          <h1 className={`text-3xl font-bold ${theme.colorText}`}>Your Cart</h1>
          <div className="w-8"></div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`rounded-xl overflow-hidden shadow-lg ${theme.colorBg} mb-6`}
            >
              <div
                className={`p-4 border-b ${theme.colorBorder} flex justify-between items-center`}
              >
                <h2
                  className={`text-lg font-semibold ${theme.colorText} flex items-center`}
                >
                  <span className="mr-2">Your Items</span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${theme.colorBgSecondary}`}
                  >
                    {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
                  </span>
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/market")}
                  className={`text-sm ${theme.colorText} hover:text-blue-500 transition-colors`}
                >
                  Continue Shopping
                </motion.button>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {cart.products.map((product) => (
                    <motion.div
                      key={product.productId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.3, type: "spring" }}
                      className={`p-4 ${theme.colorBg} flex flex-col sm:flex-row`}
                    >
                      {/* Product Image */}
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="relative w-full sm:w-24 h-24 mb-4 sm:mb-0 sm:mr-4 rounded-lg overflow-hidden"
                      >
                        <Image
                          src={product.image || "/images/default-product.png"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                      </motion.div>

                      {/* Product Details */}
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <div>
                            <h3
                              className={`font-medium ${theme.colorText} mb-1 line-clamp-2`}
                            >
                              {product.name}
                            </h3>
                            <p
                              className={`text-sm ${theme.colorText} opacity-70 mb-2`}
                            >
                              by {product.tailorName}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(product.productId)}
                            disabled={removing === product.productId}
                            className={`p-2 rounded-full ${theme.colorBgSecondary} ${theme.colorText} hover:bg-red-500 hover:text-white transition-colors ml-2 self-start`}
                          >
                            {removing === product.productId ? (
                              <FaSpinner className="text-sm animate-spin" />
                            ) : (
                              <FaTrash className="text-sm" />
                            )}
                          </motion.button>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          {/* Quantity Controls */}
                          <div
                            className={`flex items-center border ${theme.colorBorder} rounded-lg overflow-hidden`}
                          >
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                updateQuantity(
                                  product.productId,
                                  product.quantity - 1
                                )
                              }
                              disabled={
                                updating || product.quantity <= 1 || removing
                              }
                              className={`px-3 py-1 ${theme.colorBg} ${theme.colorText} hover:bg-opacity-80 transition-colors`}
                            >
                              <FaMinus className="text-xs" />
                            </motion.button>
                            <span
                              className={`px-3 py-1 ${theme.colorText} text-center min-w-[2rem]`}
                            >
                              {product.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                updateQuantity(
                                  product.productId,
                                  product.quantity + 1
                                )
                              }
                              disabled={
                                updating || product.quantity >= 10 || removing
                              }
                              className={`px-3 py-1 ${theme.colorBg} ${theme.colorText} hover:bg-opacity-80 transition-colors`}
                            >
                              <FaPlus className="text-xs" />
                            </motion.button>
                          </div>

                          {/* Price */}
                          <p className={`font-bold ${theme.colorText}`}>
                            PKR{" "}
                            {(product.price * product.quantity).toLocaleString(
                              "en-PK"
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Delivery Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={`p-4 rounded-xl ${theme.colorBg} shadow-lg border ${theme.colorBorder}`}
            >
              <h3
                className={`font-semibold mb-2 ${theme.colorText} flex items-center`}
              >
                <RiSecurePaymentFill className="mr-2 text-blue-500" />
                Delivery Information
              </h3>
              <p className={`text-sm ${theme.colorText} opacity-80`}>
                Your order will be ready in approximately{" "}
                <span className="font-semibold">7-14 days</span>. Free shipping
                on orders over PKR 5,000. You&apos;ll receive updates about your
                order via email and SMS.
              </p>
            </motion.div>
          </div>

          {/* Checkout Section */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className={`rounded-xl overflow-hidden shadow-lg ${theme.colorBg} sticky top-4`}
            >
              <div
                className={`p-4 border-b ${theme.colorBorder} flex justify-between items-center`}
              >
                <h2 className={`text-lg font-semibold ${theme.colorText}`}>
                  {checkoutStep === "details"
                    ? "Order Summary"
                    : "Payment Details"}
                </h2>
                <div className="flex items-center">
                  <motion.div
                    animate={{
                      scale: checkoutStep === "details" ? [1, 1.2, 1] : 1,
                      backgroundColor:
                        checkoutStep === "details" ? "#3B82F6" : "#9CA3AF",
                    }}
                    transition={{ duration: 0.5 }}
                    className="w-2 h-2 rounded-full mx-1"
                  ></motion.div>
                  <motion.div
                    animate={{
                      scale: checkoutStep === "payment" ? [1, 1.2, 1] : 1,
                      backgroundColor:
                        checkoutStep === "payment" ? "#3B82F6" : "#9CA3AF",
                    }}
                    transition={{ duration: 0.5 }}
                    className="w-2 h-2 rounded-full mx-1"
                  ></motion.div>
                </div>
              </div>

              <div className="p-4">
                {/* Order Details */}
                {checkoutStep === "details" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className={`${theme.colorText} opacity-80`}>
                          Subtotal ({cart.itemCount} items)
                        </span>
                        <span className={`${theme.colorText}`}>
                          PKR {cart.totalAmount.toLocaleString("en-PK")}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className={`${theme.colorText} opacity-80`}>
                          Delivery
                        </span>
                        <span className={`${theme.colorText}`}>
                          {cart.totalAmount >= 5000 ? "Free" : "PKR 300"}
                        </span>
                      </div>
                      {cart.totalAmount < 5000 && (
                        <div className={`text-sm ${theme.iconColor} mb-4`}>
                          Add PKR{" "}
                          {(5000 - cart.totalAmount).toLocaleString("en-PK")}{" "}
                          more to get free delivery!
                        </div>
                      )}
                      <div
                        className={`flex justify-between pt-4 mt-4 border-t ${theme.colorBorder}`}
                      >
                        <span className={`font-bold ${theme.colorText}`}>
                          Total
                        </span>
                        <span
                          className={`font-bold text-lg ${theme.colorText}`}
                        >
                          PKR {totalAmount.toLocaleString("en-PK")}
                        </span>
                      </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="mb-6">
                      <h3
                        className={`font-semibold mb-4 ${theme.colorText} flex items-center`}
                      >
                        <FaReceipt className="mr-2 text-blue-500" />
                        Delivery Details
                      </h3>

                      <div className="space-y-4">
                        <div className="relative">
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={checkoutData.name}
                            onChange={handleCheckoutChange}
                            className={`${inputStyles}`}
                            placeholder=" "
                            required
                          />
                          <label
                            className={`${placeHolderStyles}`}
                            htmlFor="name"
                          >
                            Full Name *
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={checkoutData.phone}
                              onChange={handleCheckoutChange}
                              className={`${inputStyles}`}
                              placeholder=" "
                              required
                            />
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="phone"
                            >
                              Phone *
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={checkoutData.email}
                              onChange={handleCheckoutChange}
                              className={`${inputStyles}`}
                              placeholder=" "
                            />
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="email"
                            >
                              Email
                            </label>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            id="streetAddress"
                            name="streetAddress"
                            value={checkoutData.streetAddress}
                            onChange={handleCheckoutChange}
                            className={`${inputStyles}`}
                            placeholder=" "
                            required
                          />
                          <label
                            className={`${placeHolderStyles}`}
                            htmlFor="streetAddress"
                          >
                            Street Address *
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={checkoutData.city}
                              onChange={handleCheckoutChange}
                              className={`${inputStyles}`}
                              placeholder=" "
                              required
                            />
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="city"
                            >
                              City *
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              id="district"
                              name="district"
                              value={checkoutData.district}
                              onChange={handleCheckoutChange}
                              className={`${inputStyles}`}
                              placeholder=" "
                              required
                            />
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="district"
                            >
                              District *
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <select
                              id="province"
                              name="province"
                              value={checkoutData.province}
                              onChange={handleCheckoutChange}
                              className={`${inputStyles}`}
                              required
                            >
                              <option value="">Select Province</option>
                              <option value="Punjab">Punjab</option>
                              <option value="Sindh">Sindh</option>
                              <option value="Khyber Pakhtunkhwa">
                                Khyber Pakhtunkhwa
                              </option>
                              <option value="Balochistan">Balochistan</option>
                              <option value="Islamabad Capital Territory">
                                Islamabad Capital Territory
                              </option>
                              <option value="Gilgit-Baltistan">
                                Gilgit-Baltistan
                              </option>
                              <option value="Azad Jammu and Kashmir">
                                Azad Jammu and Kashmir
                              </option>
                            </select>
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="province"
                            >
                              Province *
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              id="postalCode"
                              name="postalCode"
                              value={checkoutData.postalCode}
                              onChange={handleCheckoutChange}
                              className={`${inputStyles}`}
                              placeholder=" "
                            />
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="postalCode"
                            >
                              Postal Code
                            </label>
                          </div>
                        </div>

                        <div className="relative">
                          <textarea
                            id="deliveryInstructions"
                            name="deliveryInstructions"
                            value={checkoutData.deliveryInstructions}
                            onChange={handleCheckoutChange}
                            rows={2}
                            className={`${inputStyles} min-h-[60px] max-h-[120px]`}
                            placeholder=" "
                          ></textarea>
                          <label
                            className={`${placeHolderStyles}`}
                            htmlFor="deliveryInstructions"
                          >
                            Delivery Instructions
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Proceed to Payment Button */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <SimpleButton
                        btnText="Proceed to Payment"
                        type="primary"
                        fullWidth
                        onClick={proceedToPayment}
                        extraClasses="py-3 text-lg"
                      />
                    </motion.div>
                  </motion.div>
                )}

                {/* Payment Step */}
                {checkoutStep === "payment" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className={`${theme.colorText} opacity-80`}>
                          Total Amount
                        </span>
                        <span className={`font-bold ${theme.colorText}`}>
                          PKR {totalAmount.toLocaleString("en-PK")}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3
                        className={`font-semibold mb-4 ${theme.colorText} flex items-center`}
                      >
                        <FaWallet className="mr-2 text-blue-500" />
                        Payment Method
                      </h3>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`p-4 rounded-lg ${theme.colorBgSecondary} mb-4`}
                      >
                        <div className="flex items-center mb-3">
                          <input
                            type="radio"
                            id="easypaisa"
                            name="method"
                            value="easypaisa"
                            checked={paymentData.method === "easypaisa"}
                            onChange={handlePaymentChange}
                            className="mr-2"
                          />
                          <label
                            htmlFor="easypaisa"
                            className={`${theme.colorText} flex items-center`}
                          >
                            <Image
                              src="/images/payment/easypaisa.png"
                              alt="EasyPaisa"
                              width={80}
                              height={30}
                              className="ml-2"
                            />
                          </label>
                        </div>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className={`p-4 rounded-lg ${theme.colorBg} border ${theme.colorBorder}`}
                        >
                          <p className={`text-sm ${theme.colorText} mb-3`}>
                            Please send{" "}
                            <span className="font-bold">
                              PKR {totalAmount.toLocaleString("en-PK")}
                            </span>{" "}
                            to:
                          </p>

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={`p-3 rounded-lg bg-blue-50 dark:bg-blue-900 mb-3`}
                          >
                            <p
                              className={`text-sm font-bold ${theme.colorText}`}
                            >
                              EasyPaisa Account:
                            </p>
                            <p
                              className={`text-lg font-bold ${theme.colorText}`}
                            >
                              0348-9957248
                            </p>
                          </motion.div>

                          <div className="relative mt-4">
                            <input
                              type="text"
                              id="transactionId"
                              name="transactionId"
                              value={paymentData.transactionId}
                              onChange={handlePaymentChange}
                              className={`${inputStyles}`}
                              placeholder=" "
                              required
                            />
                            <label
                              className={`${placeHolderStyles}`}
                              htmlFor="transactionId"
                            >
                              Transaction ID *
                            </label>
                            <p
                              className={`text-xs mt-1 ${theme.colorText} opacity-70`}
                            >
                              You can find this in your EasyPaisa app after
                              payment
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>

                    <div className="flex gap-3">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex-1"
                      >
                        <SimpleButton
                          btnText="Back"
                          type="secondary"
                          fullWidth
                          onClick={() => setCheckoutStep("details")}
                          extraClasses="py-3"
                        />
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex-1"
                      >
                        <SimpleButton
                          btnText="Complete Payment"
                          type="primary"
                          fullWidth
                          onClick={completePayment}
                          extraClasses="py-3 text-lg"
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
