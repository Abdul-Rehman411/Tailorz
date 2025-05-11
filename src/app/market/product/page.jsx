"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  where,
  limit,
  collection,
  query,
} from "firebase/firestore";
import { db } from "@/utils/firebaseConfig";
import UserContext from "@/utils/UserContext";
import {
  FaCartPlus,
  FaHeart,
  FaPalette,
  FaMars,
  FaVenus,
  FaTransgender,
  FaTag,
  FaCube,
} from "react-icons/fa";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import SimpleButton from "@/components/SimpleButton";
import ContentSlider from "@/components/ContentSlider";
import ShareLinkDialog from "@/components/ShareLinkDialog";
import Footer from "@/components/Footer";
import AddToCart from "@/components/AddToCart";

const ProductPage = () => {
  const { theme, userData, setShowMessage, setPopUpMessageTrigger } =
    useContext(UserContext);
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImg, setCurrentImg] = useState(0);
  const [tailorName, setTailorName] = useState("");
  const [showAddToCart, setShowAddToCart] = useState(false);

  useEffect(() => {
    if (!id) {
      router.push("/404");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const productSnap = await getDoc(doc(db, "tailorProducts", id));
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() };
          setProduct(productData);

          // Fetch tailor's name using tailorId
          const tailorSnap = await getDoc(
            doc(db, "tailors", productData.tailorId)
          );
          if (tailorSnap.exists()) {
            setTailorName(tailorSnap.data().businessName || "Unknown Tailor");
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, [id, router]);

  useEffect(() => {
    if (!product) return; // wait for product

    const fetchRelated = async () => {
      const ref = collection(db, "tailorProducts");
      const q = query(
        ref,
        where(
          "baseProductData.category",
          "==",
          product.baseProductData.category
        ),
        where("price", ">=", product.price * 0.8),
        where("price", "<=", product.price * 1.2),
        limit(20)
      );

      const snap = await getDocs(q);
      const related = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => p.id !== product.id)
        .sort((a, b) => (b.coPurchaseCount || 0) - (a.coPurchaseCount || 0))
        .slice(0, 8);

      setRelatedProducts(related);
    };

    fetchRelated();
  }, [product]);

  const handleAddToCart = () => {
    if (!userData?.uid) {
      setShowMessage({
        type: "info",
        message: "Please login to add items to cart",
      });
      setPopUpMessageTrigger(true);
      return;
    }
    setShowAddToCart(true);
  };

  const handleCustomizeClick = () => {
    if (!product) return;
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
      product.baseProductData?.category || "shirt"
    );
    router.push(`/outfit-customization?outfit=${category}`);
  };

  const inc = () => setQuantity((q) => Math.min(10, q + 1));
  const dec = () => setQuantity((q) => Math.max(1, q - 1));

  console.log(relatedProducts);

  if (loading)
    return (
      <div
        className={`flex items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-lg"
          >
            Loading Product...
          </motion.p>
        </motion.div>
      </div>
    );
  if (!product)
    return (
      <div
        className={`flex items-center justify-center h-screen ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-6 max-w-md"
        >
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-5xl mb-4 ${theme.iconColor}`}
          >
            <i className="fas fa-exclamation-triangle"></i>
          </motion.div>
          <h1 className="text-2xl font-bold mb-4">
            Product not Found. This product may have been removed by the owner
            or never listed.
          </h1>
          <SimpleButton
            btnText="Try Again"
            type="primary"
            onClick={() => window.location.reload()}
          />
        </motion.div>
      </div>
    );

  const imgs = product.images || [];
  const date = new Date(product.createdAt);

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Still 0-indexed
  const day = date.getDate();
  const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;

  return (
    <div className="h-full overflow-y-auto">
      <div
        className={`max-w-[99.5%] mx-auto mt-4 mb-14 md:my-1 w-auto p-6 rounded-t-lg select-none ${theme.mainTheme}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${theme.colorBg} ${theme.hoverShadow} rounded-lg shadow-lg overflow-hidden`}
        >
          <div className="grid lg:grid-cols-2 gap-6">
            {/* IMAGE CAROUSEL */}
            <div className="relative w-full h-[500px]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentImg}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imgs[currentImg] || product.baseProductData.imageUrl}
                    alt={product.baseProductData.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              {imgs.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-3 h-3 rounded-full ${
                        i === currentImg ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DETAILS */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                {/* Title, Price */}
                <h1 className={`text-3xl font-bold ${theme.colorText}`}>
                  {product.baseProductData.name}
                </h1>
                <p className={`text-xl font-semibold mt-2 ${theme.colorText}`}>
                  PKR {product.price.toLocaleString("en-PK")}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.has3DTryOn && (
                    <span className="flex items-center px-2 py-1 bg-blue-200 text-blue-800 rounded">
                      <FaCube className="mr-1" /> 3D Try-On
                    </span>
                  )}
                  {product.isCustom && (
                    <span className="flex items-center px-2 py-1 bg-purple-200 text-purple-800 rounded">
                      <FaPalette className="mr-1" /> Custom
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-sm opacity-70 mt-4">
                  <div className="flex items-center">
                    <FaTag className="mr-1" />
                    {product.baseProductData.category}
                  </div>
                  <div className="flex items-center">
                    {product.baseProductData.gender === "male" && (
                      <FaMars className="mr-1" />
                    )}
                    {product.baseProductData.gender === "female" && (
                      <FaVenus className="mr-1" />
                    )}
                    {product.baseProductData.gender === "unisex" && (
                      <FaTransgender className="mr-1" />
                    )}
                    {product.baseProductData.gender}
                  </div>
                  <div>
                    Listed by:{" "}
                    <a
                      href={`/tailors/profile/${product.tailorId}`}
                      className="text-blue-600 hover:underline font-bold"
                    >
                      {tailorName}
                    </a>
                  </div>
                  <div>Added: {formattedDate}</div>
                  <div>Delivery: {product.deliveryTime}</div>
                </div>

                <p className={`mt-4 ${theme.colorText} opacity-80`}>
                  {product.description}
                </p>

                {/* Quantity under description */}
                <div className="mt-4 flex items-center space-x-4">
                  <button onClick={dec} className="px-3 border rounded">
                    −
                  </button>
                  <span className={`${theme.colorText}`}>{quantity}</span>
                  <button onClick={inc} className="px-3 border rounded">
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <SimpleButton
                  onClick={handleAddToCart}
                  btnText={`Add to Cart (${quantity})`}
                  type="accent"
                  icon={<FaCartPlus />}
                />
                {product.has3DTryOn && (
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
                      handleCustomizeClick();
                    }}
                  />
                )}
                <ShareLinkDialog
                  shareLink={window.location.toString()}
                  sender={userData ? userData : { fullName: "Someone" }}
                  subject={"Product"}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-10 pt-12">
            <div>
              <span className="font-bold text-xl">Related Products</span>
            </div>
            <ContentSlider content={relatedProducts} />
          </div>
        )}
      </div>
      <Footer />

      {showAddToCart && product && (
        <AddToCart
          product={product}
          onClose={() => setShowAddToCart(false)}
          theme={theme}
          customizedProductLink={""}
          userId={userData?.uid}
        />
      )}
    </div>
  );
};

export default ProductPage;
