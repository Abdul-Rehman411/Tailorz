"use client";
import React, { useState, useEffect, useContext } from "react";
import { db } from "@/utils/firebaseConfig";
import { collection, query, where, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import UserContext from "@/utils/UserContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";
import SimpleButton from "@/components/SimpleButton";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const TailorAnalytics = () => {
  const { theme, userData } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [products, setProducts] = useState([]);
  const [timeRange, setTimeRange] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.bId) return;

      setLoading(true);
      try {
        // Fetch orders
        const ordersQuery = query(
          collection(db, "OrdersManagement"),
          where("tailorId", "==", userData.bId),
          orderBy("placedOnDate", "desc")
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map((Doc) => ({
          id: Doc.id,
          ...Doc.data(),
        }));
        setOrders(ordersData);

        // Fetch wallet data
        const walletRef = doc(db, "tailorWallet", userData.bId);
        const walletSnap = await getDoc(walletRef);
        if (walletSnap.exists()) {
          setWalletData(walletSnap.data());
        }

        // Fetch products
        const productsQuery = query(
          collection(db, "tailorProducts"),
          where("tailorId", "==", userData.bId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((ProductDoc) => ({
          id: ProductDoc.id,
          ...ProductDoc.data(),
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userData?.bId]);

  // Process data for charts
  const getOrderStatusData = () => {
    const statusCounts = {
      paymentVerificationPending: 0,
      paymentVerified: 0,
      startedStitching: 0,
      onDelivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      statusCounts[order.orderStatus] =
        (statusCounts[order.orderStatus] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase()),
      value: count,
    }));
  };

  const getRevenueData = () => {
    const revenueByMonth = {};
    const now = new Date();
    const monthsToShow = timeRange === "monthly" ? 6 : 12;

    // Initialize months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthKey = format(date, "MMM yyyy");
      revenueByMonth[monthKey] = 0;
    }

    // Calculate revenue
    orders.forEach((order) => {
      if (order.orderStatus === "delivered") {
        const orderDate = order.placedOnDate?.toDate
          ? order.placedOnDate.toDate()
          : new Date(order.placedOnDate);
        const monthKey = format(orderDate, "MMM yyyy");

        if (revenueByMonth.hasOwnProperty(monthKey)) {
          revenueByMonth[monthKey] += order.totalAmount || 0;
        }
      }
    });

    return Object.entries(revenueByMonth).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getProductPerformanceData = () => {
    const productCounts = {};

    orders.forEach((order) => {
      order.products?.forEach((product) => {
        productCounts[product.productId] =
          (productCounts[product.productId] || 0) + 1;
      });
    });

    const productData = Object.entries(productCounts).map(([productId, count]) => {
        const product = products.find((p) => String(p.id) === String(productId));
        return {
        name: product?.baseProductData?.name || `Product ${productId}`,
        value: count,
      };
    });

    return productData.sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const getCityDistributionData = () => {
    const cityCounts = {};

    orders.forEach((order) => {
      const city = order.deliveryAddress?.city || "Unknown";
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    return Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const getTransactionData = () => {
    if (!walletData?.transactions) return [];

    return walletData.transactions
      .map((transaction) => ({
        ...transaction,
        date: transaction.date?.toDate
          ? transaction.date.toDate()
          : new Date(transaction.date),
      }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return format(date, "MMM d, yyyy");
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${theme.mainTheme}`}>
        <ClipLoader size={60} color={theme.iconColor} />
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${theme.mainTheme}`}>
      <div className="max-w-[99.5%] mx-auto my-4 md:my-1 h-full select-none p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-6 rounded-xl ${theme.colorBg} mb-6`}
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${theme.colorText}`}>Analytics Dashboard</h1>
              <p className={`${theme.colorText} opacity-80`}>
                Insights and performance metrics for your tailoring business
              </p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`p-2 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} text-sm`}
              >
                <option value="monthly">Last 6 Months</option>
                <option value="yearly">Last 12 Months</option>
              </select>
              <SimpleButton
                btnText={
                  <>
                    <i className="fas fa-sync-alt mr-2"></i>
                    Refresh
                  </>
                }
                type="secondary"
                onClick={() => window.location.reload()}
                small
              />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={`flex mb-6 border-b ${theme.colorBorder}`}>
          {["overview", "orders"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab
                  ? `${theme.colorText} border-b-2 border-blue-500`
                  : `${theme.subTextColor} hover:${theme.hoverText}`
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: "Total Orders",
                    value: orders.length,
                    icon: "fas fa-shopping-bag",
                    color: "bg-blue-500",
                  },
                  {
                    title: "Completed Orders",
                    value: orders.filter((o) => o.orderStatus === "delivered").length,
                    icon: "fas fa-check-circle",
                    color: "bg-green-500",
                  },
                  {
                    title: "Total Revenue",
                    value: orders
                      .filter((o) => o.orderStatus === "delivered")
                      .reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                    format: formatCurrency,
                    icon: "fas fa-money-bill-wave",
                    color: "bg-purple-500",
                  },
                  {
                    title: "Active Products",
                    value: products.length,
                    icon: "fas fa-tshirt",
                    color: "bg-orange-500",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className={`p-6 rounded-xl shadow-md ${theme.colorBg} transition-all duration-300`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className={`text-sm ${theme.colorText} opacity-80 mb-1`}>
                          {stat.title}
                        </p>
                        <h3 className={`text-2xl font-bold ${theme.colorText}`}>
                          {stat.format ? stat.format(stat.value) : stat.value}
                        </h3>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-full ${stat.color} bg-opacity-20 flex items-center justify-center`}
                      >
                        <i className={`${stat.icon} ${stat.color} text-xl`}></i>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`p-6 rounded-xl ${theme.colorBg} h-96`}
                >
                  <h3 className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                    Order Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={getOrderStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {getOrderStatusData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.colorBg,
                          borderColor: theme.colorBorder,
                          borderRadius: "0.5rem",
                        }}
                        itemStyle={{ color: theme.colorText }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Revenue Trend Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-6 rounded-xl ${theme.colorBg} h-96`}
                >
                  <h3 className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                    Revenue Trend ({timeRange === "monthly" ? "Monthly" : "Yearly"})
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={getRevenueData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), "Revenue"]}
                        contentStyle={{
                          backgroundColor: theme.colorBg,
                          borderColor: theme.colorBorder,
                          borderRadius: "0.5rem",
                        }}
                        itemStyle={{ color: theme.colorText }}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Revenue"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`p-6 rounded-xl ${theme.colorBg} h-96`}
                >
                  <h3 className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                    Top Performing Products
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      layout="vertical"
                      data={getProductPerformanceData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [value, "Orders"]}
                        contentStyle={{
                          backgroundColor: theme.colorBg,
                          borderColor: theme.colorBorder,
                          borderRadius: "0.5rem",
                        }}
                        itemStyle={{ color: theme.colorText }}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Orders"
                        fill="#8884d8"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* City Distribution Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`p-6 rounded-xl ${theme.colorBg} h-96`}
                >
                  <h3 className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                    Customer City Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={getCityDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {getCityDistributionData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [value, "Orders"]}
                        contentStyle={{
                          backgroundColor: theme.colorBg,
                          borderColor: theme.colorBorder,
                          borderRadius: "0.5rem",
                        }}
                        itemStyle={{ color: theme.colorText }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl ${theme.colorBg}`}
              >
                <h2 className={`text-2xl font-bold mb-6 ${theme.colorText}`}>
                  Order Analytics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Status Timeline */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-6 rounded-xl ${theme.colorBg} h-96`}
                  >
                    <h3 className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                      Order Status Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <LineChart
                        data={getRevenueData()} // Using same data structure for simplicity
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme.colorBg,
                            borderColor: theme.colorBorder,
                            borderRadius: "0.5rem",
                          }}
                          itemStyle={{ color: theme.colorText }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Orders"
                          stroke="#8884d8"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Recent Orders Table */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`p-6 rounded-xl ${theme.colorBg}`}
                  >
                    <h3 className={`text-lg font-bold mb-4 ${theme.colorText}`}>
                      Recent Orders
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${theme.colorBorder}`}>
                            <th className={`py-2 text-left ${theme.colorText}`}>
                              Order ID
                            </th>
                            <th className={`py-2 text-left ${theme.colorText}`}>
                              Date
                            </th>
                            <th className={`py-2 text-left ${theme.colorText}`}>
                              Status
                            </th>
                            <th className={`py-2 text-right ${theme.colorText}`}>
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((order, index) => (
                            <motion.tr
                              key={order.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className={`border-b ${theme.colorBorder} hover:${theme.hoverBg}`}
                            >
                              <td className="py-3">
                                <span className="text-sm font-medium">
                                  #{order.id.substring(0, 8)}
                                </span>
                              </td>
                              <td>
                                <span className="text-sm">
                                  {formatDate(
                                    order.placedOnDate?.toDate
                                      ? order.placedOnDate.toDate()
                                      : new Date(order.placedOnDate)
                                  )}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    order.orderStatus === "delivered"
                                      ? "bg-green-100 text-green-800"
                                      : order.orderStatus === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {order.orderStatus
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </span>
                              </td>
                              <td className="text-right">
                                <span className="font-medium">
                                  {formatCurrency(order.totalAmount)}
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TailorAnalytics;