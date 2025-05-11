"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/utils/firebaseConfig";
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaShoppingCart,
  FaCheck,
  FaExclamation,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";

const AddToCart = ({ product, onClose, theme, userId, customizedProductLink }) => {
  const [animationStage, setAnimationStage] = useState(1);
  const [cartExists, setCartExists] = useState(false);
  const [currentTailorId, setCurrentTailorId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalItemsInCart, setTotalItemsInCart] = useState(0);
  const router = useRouter();

  const didInit = useRef(false);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      checkCartExistence();
    }
  }, []);

  const validateProduct = (product) => {
    return {
      productId: product.productId || "",
      quantity: quantity,
      price: product.price,
      name: product.baseProductData?.name || "Unnamed Product",
      image:
        product.isCustom && product.images?.length > 0
          ? product.images[0]
          : product.baseProductData?.imageUrl || "/images/default-product.png",
      customizedProductLink: customizedProductLink || "", 
      tailorId: product.tailorId || "",
      tailorName: product.tailor || "Unknown Tailor",
    };
  };

  const createOrderDocument = (userId, product) => {
    return {
      userId: userId || "",
      tailorId: product.tailorId || "",
      products: [validateProduct(product)],
      placedOnDate: new Date(),
      paymentDetails: [{ paymentStatus: "pending" }],
      deliveryAddress: {
        streetAddress: "",
        city: "",
        District: "",
        province: "",
        postalCode: "",
        Country: "",
        deliveryInstructions: "",
      },
      orderStatus: "inCart",
      totalAmount: product.price * quantity,
      itemCount: quantity,
    };
  };

  const checkCartExistence = async () => {
    try {
      if (!userId) {
        setError("User not logged in");
        return;
      }

      const ordersCollection = collection(db, "OrdersManagement");
      const cartQuery = query(
        ordersCollection,
        where("userId", "==", userId),
        where("orderStatus", "==", "inCart")
      );
      const querySnapshot = await getDocs(cartQuery);

      if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        setCartExists(true);
        setCurrentTailorId(cartDoc.data().tailorId);
        setTotalItemsInCart(cartDoc.data().itemCount);

        // Check if product already exists in cart
        const existingProduct = cartDoc
          .data()
          .products.find((p) => p.productId === product.productId);

        if (existingProduct) {
          setShowDuplicateWarning(true);
          return;
        }

        // If cart has different tailor, show confirmation
        if (cartDoc.data().tailorId !== product.tailorId) {
          setTimeout(() => setShowConfirmation(true), 3000);
          return;
        }
      }

      // Proceed to add after animation if no conflicts
      addToCart();

      // Animation sequence
      setTimeout(() => setAnimationStage(2), 1000);
      setTimeout(() => setAnimationStage(3), 2000);
    } catch (err) {
      console.error("Error checking cart:", err);
      setError("Failed to check cart. Please try again.");
    }
  };

  const addToCart = async (replaceCart = false) => {
    try {
      if (!userId) {
        setError("User not logged in");
        return;
      }

      const ordersCollection = collection(db, "OrdersManagement");
      const cartQuery = query(
        ordersCollection,
        where("userId", "==", userId),
        where("orderStatus", "==", "inCart")
      );
      const querySnapshot = await getDocs(cartQuery);

      if (querySnapshot.empty) {
        // Create new cart with the product
        const newCartRef = doc(ordersCollection);
        await setDoc(newCartRef, createOrderDocument(userId, product));
        setTotalItemsInCart(quantity);
      } else {
        const cartDoc = querySnapshot.docs[0];
        const cartData = cartDoc.data();

        // Handle different tailor case
        if (cartData.tailorId !== product.tailorId) {
          if (replaceCart) {
            // Replace entire cart with new product from different tailor
            await updateDoc(cartDoc.ref, {
              ...createOrderDocument(userId, product),
              // Keep the same document ID
              id: cartDoc.id,
            });
            setTotalItemsInCart(quantity);
          } else {
            // This shouldn't happen as we show confirmation first
            setError(
              "Cannot add product from different tailor without confirmation"
            );
            return;
          }
        } else {
          // Check if product already exists in cart
          const existingProductIndex = cartData.products.findIndex(
            (p) => p.productId === product.productId
          );

          if (existingProductIndex >= 0) {
            // Update quantity if product exists
            const updatedProducts = [...cartData.products];
            updatedProducts[existingProductIndex].quantity += quantity;

            await updateDoc(cartDoc.ref, {
              products: updatedProducts,
              totalAmount: cartData.totalAmount + product.price * quantity,
              itemCount: cartData.itemCount + quantity,
            });
            setTotalItemsInCart(cartData.itemCount + quantity);
          } else {
            // Add new product to existing cart
            await updateDoc(cartDoc.ref, {
              products: arrayUnion(validateProduct(product)),
              totalAmount: cartData.totalAmount + product.price * quantity,
              itemCount: cartData.itemCount + quantity,
            });
            setTotalItemsInCart(cartData.itemCount + quantity);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => setAnimationStage(4), 1000);
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add to cart. Please try again.");
    }
  };

  const handleConfirmation = (confirmed) => {
    setShowConfirmation(false);
    if (confirmed) {
      addToCart(true); // Pass true to indicate we want to replace the cart
    } else {
      onClose();
    }
  };

  const handleDuplicateConfirmation = (confirmed) => {
    setShowDuplicateWarning(false);
    if (confirmed) {
      addToCart();
    } else {
      onClose();
    }
  };

  const handleViewCart = () => {
    onClose();
    router.push("/cart");
  };

  const handleContinueShopping = () => {
    onClose();
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 10));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  // Animation variants
  const productVariants = {
    initial: { y: -1000, rotate: -15 },
    animate: { y: 0, rotate: 0 },
    exit: { y: 100, opacity: 0 },
  };

  const cartVariants = {
    initial: { x: -1000, scale: 0.8 },
    animate: { x: 0, scale: 1 },
    exit: { x: 1000, scale: 0.8 },
  };

  const successVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      {/* Main Animation Sequence */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Product Flying Animation */}
        <AnimatePresence>
          {animationStage >= 1 && animationStage <= 3 && (
            <motion.div
              key="product"
              variants={productVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 300,
                rotate: { duration: 0.4 },
              }}
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-30 origin-bottom"
            >
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={
                    product.isCustom && product.images?.length > 0
                      ? product.images[0]
                      : product.baseProductData?.imageUrl ||
                        "/images/default-product.png"
                  }
                  alt={product.baseProductData?.name || "Product"}
                  fill
                  className="object-contain drop-shadow-lg"
                  style={{ transform: "translateY(-20px)" }}
                />
                {/* String animation */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                  <motion.div
                    animate={{
                      rotate: [0, 15, -15, 0],
                      transition: { repeat: Infinity, duration: 1.5 },
                    }}
                    className="w-6 h-6 flex justify-center origin-bottom"
                  >
                    <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                    <div className="absolute top-0 w-6 h-2 bg-gray-300 rounded-full"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Animation */}
        <AnimatePresence>
          {animationStage >= 2 && animationStage <= 3 && (
            <motion.div
              key="cart"
              variants={cartVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <div className="relative w-32 h-24 md:w-40 md:h-28">
                {/* Cart body */}
                <div className="absolute bottom-0 w-full h-3/4 bg-blue-500 rounded-lg shadow-xl flex items-end justify-center overflow-hidden">
                  <div className="w-4/5 h-1/2 bg-blue-400 rounded-t-lg"></div>
                  {/* Wheels */}
                  <div className="absolute bottom-0 left-2 w-6 h-6 bg-blue-600 rounded-full border-2 border-blue-700"></div>
                  <div className="absolute bottom-0 right-2 w-6 h-6 bg-blue-600 rounded-full border-2 border-blue-700"></div>
                </div>
                {/* Cart handle */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-blue-500 rounded-full"></div>
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-blue-500 rounded-full"></div>
                {/* Cart details */}
                <div className="absolute -top-2 left-1/4 w-3 h-3 bg-blue-300 rounded-full"></div>
                <div className="absolute -top-2 right-1/4 w-3 h-3 bg-blue-300 rounded-full"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Drop Animation */}
        <AnimatePresence>
          {animationStage === 3 && (
            <motion.div
              key="product-drop"
              initial={{ y: -100, opacity: 1 }}
              animate={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-30"
              onAnimationComplete={() => setAnimationStage(3.5)}
            >
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={
                    product.isCustom && product.images?.length > 0
                      ? product.images[0]
                      : product.baseProductData?.imageUrl ||
                        "/images/default-product.png"
                  }
                  alt={product.baseProductData?.name || "Product"}
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Bounce Animation */}
        <AnimatePresence>
          {animationStage >= 3.5 && animationStage < 4 && (
            <motion.div
              key="cart-bounce"
              initial={{ y: 0 }}
              animate={{
                y: [0, -20, 0],
                transition: { repeat: 2, duration: 0.3 },
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
              onAnimationComplete={() => setAnimationStage(4)}
            >
              <div className="relative w-32 h-24 md:w-40 md:h-28">
                <div className="absolute bottom-0 w-full h-3/4 bg-blue-500 rounded-lg shadow-xl flex items-end justify-center overflow-hidden">
                  <div className="w-4/5 h-1/2 bg-blue-400 rounded-t-lg"></div>
                  <div className="absolute bottom-0 left-2 w-6 h-6 bg-blue-600 rounded-full border-2 border-blue-700"></div>
                  <div className="absolute bottom-0 right-2 w-6 h-6 bg-blue-600 rounded-full border-2 border-blue-700"></div>
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-blue-500 rounded-full"></div>
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-blue-500 rounded-full"></div>
                <div className="absolute -top-2 left-1/4 w-3 h-3 bg-blue-300 rounded-full"></div>
                <div className="absolute -top-2 right-1/4 w-3 h-3 bg-blue-300 rounded-full"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {animationStage >= 4 && success && (
            <motion.div
              key="success"
              variants={successVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`relative z-40 p-6 rounded-xl ${theme.colorBg} shadow-2xl text-center overflow-hidden`}
            >
              {/* Confetti effect */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{
                      x: Math.random() * 100 - 50,
                      y: Math.random() * 100 - 50,
                      opacity: 0,
                    }}
                    animate={{
                      x: Math.random() * 300 - 150,
                      y: Math.random() * 300 - 150,
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.2, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.05,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <FaCheck className="text-white text-3xl" />
                  </motion.div>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${theme.colorText}`}>
                  Added to Cart!
                </h3>
                <p className={`mb-6 ${theme.colorText} opacity-90`}>
                  <span className="font-semibold">
                    {product.baseProductData?.name || "Product"}
                  </span>{" "}
                  has been added to your cart.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleViewCart}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <FaShoppingCart />
                    View Cart ({totalItemsInCart} item
                    {totalItemsInCart > 1 ? "s" : ""})
                    <FaChevronRight className="ml-1" />
                  </button>
                  <button
                    onClick={handleContinueShopping}
                    className={`px-6 py-3 rounded-lg ${theme.colorBgSecondary} ${theme.colorText} hover:bg-opacity-80 transition-all font-medium`}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`relative z-40 p-6 rounded-xl bg-red-100 dark:bg-red-900 shadow-2xl text-center`}
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaExclamation className="text-white text-3xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-red-800 dark:text-red-200">
                Oops!
              </h3>
              <p className="mb-6 text-red-700 dark:text-red-300">{error}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition-all font-medium"
                >
                  Close
                </button>
                {error === "User not logged in" && (
                  <button
                    onClick={() => router.push("/login")}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    Go to Login
                    <FaChevronRight className="ml-1" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Dialog for Different Tailor */}
        <AnimatePresence>
          {showConfirmation && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`relative z-40 p-6 rounded-xl ${theme.colorBg} shadow-2xl text-center max-w-sm w-full`}
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaExclamation className="text-white text-2xl" />
                </div>
              </div>
              <h3 className={`text-xl font-bold mb-3 ${theme.colorText}`}>
                Different Tailor Detected
              </h3>
              <p className={`mb-4 text-sm ${theme.colorText} opacity-90`}>
                Your cart contains items from another tailor. For the best
                shopping experience, we recommend purchasing from one tailor at
                a time.
              </p>

              <div className="mb-6 space-y-3">
                <button
                  onClick={() => handleConfirmation(true)}
                  className={`w-full p-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all flex flex-col items-center`}
                >
                  <span className="font-bold">Start New Order</span>
                  <span className="text-xs opacity-90">
                    Clear current cart and add this item
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    handleViewCart();
                  }}
                  className={`w-full p-4 rounded-lg border ${theme.colorBorder} ${theme.colorText} hover:bg-opacity-10 transition-all flex flex-col items-center`}
                >
                  <span className="font-bold">Review Current Cart</span>
                  <span className="text-xs opacity-90">
                    Keep your existing items
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                <span className="px-3">or</span>
                <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
              </div>

              <button
                onClick={() => handleConfirmation(false)}
                className={`w-full py-2.5 rounded-lg ${theme.colorText} hover:bg-opacity-10 transition-all text-sm font-medium`}
              >
                Continue Shopping
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Duplicate Product Warning */}
        <AnimatePresence>
          {showDuplicateWarning && (
            <motion.div
              key="duplicate-warning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`relative z-40 p-6 rounded-xl ${theme.colorBg} shadow-2xl text-center`}
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                  <FaExclamation className="text-white text-3xl" />
                </div>
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${theme.colorText}`}>
                Product Already in Cart
              </h3>
              <p className={`mb-6 ${theme.colorText} opacity-90`}>
                This product is already in your cart. Do you want to add it
                again and increase the quantity?
              </p>

              {/* Quantity Selector */}
              <div
                className={`mb-6 p-4 rounded-lg ${theme.colorBgSecondary} flex items-center justify-between`}
              >
                <span className={`${theme.colorText}`}>Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementQuantity}
                    className={`w-8 h-8 rounded-full ${theme.colorBg} ${theme.colorText} flex items-center justify-center hover:bg-opacity-80`}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className={`text-lg font-semibold ${theme.colorText}`}>
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    className={`w-8 h-8 rounded-full ${theme.colorBg} ${theme.colorText} flex items-center justify-center hover:bg-opacity-80`}
                    disabled={quantity >= 10}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDuplicateConfirmation(true)}
                  className="px-6 py-3 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-all font-medium"
                >
                  Add Anyway
                </button>
                <button
                  onClick={() => handleDuplicateConfirmation(false)}
                  className={`px-6 py-3 rounded-lg ${theme.colorBgSecondary} ${theme.colorText} hover:bg-opacity-80 transition-all font-medium`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AddToCart;
