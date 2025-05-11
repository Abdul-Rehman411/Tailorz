"use client";
import { useState, useEffect, useContext } from "react";
import { db } from "@/utils/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import UserContext from "@/utils/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import SimpleButton from "@/components/SimpleButton";
import DialogBox from "@/components/DialogBox";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCoins, FaTimes } from "react-icons/fa";

const TailorWallet = () => {
  const { theme, userData, setShowMessage, setPopUpMessageTrigger } =
    useContext(UserContext);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [updating, setUpdating] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [useMax, setUseMax] = useState(false);

  // Bank form state
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });

  // Fetch wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!userData?.bId) return;

      setLoading(true);
      try {
        const walletRef = doc(db, "tailorWallet", userData.bId);
        const walletSnap = await getDoc(walletRef);

        if (walletSnap.exists()) {
          const data = walletSnap.data();
          setWalletData(data);

          // Check if bank info is missing
          if (!data.bankName || !data.accountName || !data.accountNumber) {
            setShowBankDialog(true);
          }
        } else {
          // Create new wallet if doesn't exist
          const newWallet = {
            tailorId: userData.bId,
            bankName: "",
            accountName: "",
            accountNumber: "",
            currentBalance: 0,
            transactions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await setDoc(walletRef, newWallet);
          setWalletData(newWallet);
          setShowBankDialog(true);
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        setShowMessage({
          type: "danger",
          message: "Failed to load wallet data. Please try again.",
        });
        setPopUpMessageTrigger(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [userData?.bId, setShowMessage, setPopUpMessageTrigger]);

  // Handle bank info submission
  const handleBankSubmit = async () => {
    if (
      !bankForm.bankName ||
      !bankForm.accountName ||
      !bankForm.accountNumber
    ) {
      setShowMessage({
        type: "warning",
        message: "Please fill all bank details",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    setUpdating(true);
    try {
      const walletRef = doc(db, "tailorWallet", userData.bId);
      await updateDoc(walletRef, {
        bankName: bankForm.bankName,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
        updatedAt: new Date(),
      });

      // Update local state
      setWalletData((prev) => ({
        ...prev,
        bankName: bankForm.bankName,
        accountName: bankForm.accountName,
        accountNumber: bankForm.accountNumber,
      }));

      setShowMessage({
        type: "success",
        message: "Bank information updated successfully!",
      });
      setPopUpMessageTrigger(true);
      setShowBankDialog(false);
    } catch (error) {
      console.error("Error updating bank info:", error);
      setShowMessage({
        type: "danger",
        message: "Failed to update bank information. Please try again.",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setUpdating(false);
    }
  };

  // Handle payout request
  const handlePayoutRequest = async () => {
    const amount = Number(payoutAmount);
    let currentBalance = Number(walletData.currentBalance);

    if (isNaN(currentBalance)) {
      currentBalance = 0;
    }

    if (amount % 500 != 0) {
      setShowMessage({
        type: "warning",
        message: "Enter the amount in multiples of 500. (min 500)",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (isNaN(amount)) {
      setShowMessage({
        type: "warning",
        message: "Please enter a valid amount",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (amount <= 0) {
      setShowMessage({
        type: "warning",
        message: "Amount must be greater than 0",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (amount > currentBalance) {
      setShowMessage({
        type: "warning",
        message: "Amount exceeds your current balance",
      });
      setPopUpMessageTrigger(true);
      return;
    }

    if (
      !walletData.bankName ||
      !walletData.accountName ||
      !walletData.accountNumber
    ) {
      setShowMessage({
        type: "warning",
        message: "Please update your bank information first",
      });
      setPopUpMessageTrigger(true);
      setShowBankDialog(true);
      return;
    }

    setUpdating(true);
    try {
      const walletRef = doc(db, "tailorWallet", userData.bId);
      const newTransaction = {
        type: "payOut",
        amount: amount,
        date: new Date(), // Use client-side timestamp instead of servertimestamp
        status: "pending",
      };

      await updateDoc(walletRef, {
        transactions: [...walletData.transactions, newTransaction],
        currentBalance: currentBalance - amount,
        updatedAt: new Date(),
      });

      // Update local state
      setWalletData((prev) => ({
        ...prev,
        transactions: [...prev.transactions, newTransaction],
        currentBalance: prev.currentBalance - amount,
      }));

      setShowMessage({
        type: "success",
        message: "Payout request submitted successfully!",
      });
      setPopUpMessageTrigger(true);
      setShowPayoutDialog(false);
      setPayoutAmount("");
    } catch (error) {
      console.error("Error submitting payout request:", error);
      setShowMessage({
        type: "danger",
        message: "Failed to submit payout request. Please try again.",
      });
      setPopUpMessageTrigger(true);
    } finally {
      setUpdating(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions based on selected filters
  const filteredTransactions = () => {
    if (!walletData?.transactions) return [];

    let transactions = [...walletData.transactions];

    // Filter by type
    if (transactionFilter !== "all") {
      transactions = transactions.filter((t) => t.type === transactionFilter);
    }

    // Filter by date range
    if (startDate && endDate) {
      transactions = transactions.filter((t) => {
        const transactionDate = t.date?.toDate
          ? t.date.toDate()
          : new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    return transactions.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
  };
  const maxValue = Math.floor((walletData?.currentBalance || 0) / 500) * 500;

  // Clear date filters
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center h-screen ${theme.mainTheme}`}
      >
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
              <h1 className={`text-3xl font-bold mb-2 ${theme.colorText}`}>
                My Wallet
              </h1>
              <p className={`${theme.colorText} opacity-80`}>
                Manage your earnings and transactions
              </p>
            </div>
            <div className="mt-4 md:mt-0">
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

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-xl mb-8 bg-gradient-to-r from-blue-600/50 to-purple-600/30 text-white shadow-lg`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm opacity-90">Current Balance</p>
              <h2 className="text-4xl font-bold my-2">
                {formatCurrency(walletData?.currentBalance || 0)}
              </h2>
              <p className="text-sm opacity-90 flex items-center gap-1">
                {walletData.currentBalance >= 500 ? (
                  <>
                    <i className="fas fa-check-circle text-green-500"></i>
                    Available for withdrawal
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle text-red-500"></i>
                    Min to withdraw: 500
                  </>
                )}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <i className="fas fa-wallet text-2xl"></i>
            </div>
          </div>

          <div>
            <SimpleButton
              btnText={"Request Payout"}
              type="default"
              icon={<i className="fas fa-money-bill-wave"></i>}
              extraclasses="mt-3"
              disabled={walletData.currentBalance <= 500}
              onClick={() => setShowPayoutDialog(true)}
            />
          </div>
        </motion.div>

        {/* Bank Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-xl ${theme.colorBg} mb-8`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${theme.colorText}`}>
              Bank Information
            </h2>
            <SimpleButton
              btnText="Edit"
              type="secondary"
              onClick={() => setShowBankDialog(true)}
              small
            />
          </div>

          {walletData?.bankName &&
          walletData?.accountName &&
          walletData?.accountNumber ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${theme.colorText} opacity-70`}>
                  Bank Name
                </p>
                <p className={`font-medium ${theme.colorText}`}>
                  {walletData.bankName}
                </p>
              </div>
              <div>
                <p className={`text-sm ${theme.colorText} opacity-70`}>
                  Account Name
                </p>
                <p className={`font-medium ${theme.colorText}`}>
                  {walletData.accountName}
                </p>
              </div>
              <div>
                <p className={`text-sm ${theme.colorText} opacity-70`}>
                  Account Number
                </p>
                <p className={`font-medium ${theme.colorText}`}>
                  {walletData.accountNumber}
                </p>
              </div>
            </div>
          ) : (
            <div className={`text-center py-4 ${theme.colorText} opacity-80`}>
              <i className="fas fa-university text-3xl mb-2"></i>
              <p>No bank information added yet</p>
              <SimpleButton
                btnText="Add Bank Details"
                type="primary"
                onClick={() => setShowBankDialog(true)}
                extraClasses="mt-4"
              />
            </div>
          )}
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-xl ${theme.colorBg}`}
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className={`text-xl font-bold ${theme.colorText}`}>
              Transaction History
            </h2>

            <div className="mt-4 md:mt-0 flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className={`p-2 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} text-sm`}
              >
                <option value="all">All Transactions</option>
                <option value="payIn">Payments Received</option>
                <option value="payOut">Payouts</option>
              </select>

              <div className="flex space-x-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Start Date"
                  className={`p-2 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} text-sm w-full`}
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="End Date"
                  className={`p-2 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder} text-sm w-full`}
                />
                {(startDate || endDate) && (
                  <SimpleButton
                    btnText="Clear"
                    type="secondary"
                    onClick={clearDateFilters}
                    small
                  />
                )}
              </div>
            </div>
          </div>

          {filteredTransactions().length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions().map((transaction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                  className={`p-4 rounded-lg flex justify-between items-center ${
                    transaction.type === "payIn"
                      ? "bg-green-500 bg-opacity-10"
                      : "bg-blue-500 bg-opacity-10"
                  } border-l-4 ${
                    transaction.type === "payIn"
                      ? "border-green-500"
                      : transaction.status === "completed"
                      ? "border-blue-500"
                      : transaction.status === "pending"
                      ? "border-yellow-500"
                      : "border-red-500"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`p-3 rounded-full mr-4 ${
                        transaction.type === "payIn"
                          ? "bg-green-500 bg-opacity-20 text-green-500"
                          : "bg-blue-500 bg-opacity-20 text-blue-500"
                      }`}
                    >
                      <i
                        className={`fas ${
                          transaction.type === "payIn"
                            ? "fa-arrow-down"
                            : "fa-arrow-up"
                        }`}
                      ></i>
                    </div>
                    <div>
                      <p className={`font-medium ${theme.colorText}`}>
                        {transaction.type === "payIn"
                          ? "Payment Received"
                          : "Payout Request"}
                      </p>
                      <p className={`text-sm ${theme.colorText} opacity-80`}>
                        {formatDate(transaction.date)}
                      </p>
                      {transaction.type === "payOut" && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full mt-1 ${
                            transaction.status === "completed"
                              ? "bg-green-500 bg-opacity-20 text-green-500"
                              : transaction.status === "pending"
                              ? "bg-yellow-500 bg-opacity-20 text-yellow-500"
                              : "bg-red-500 bg-opacity-20 text-red-500"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-right ${
                      transaction.type === "payIn"
                        ? "text-green-500"
                        : transaction.status === "failed"
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  >
                    <p className="font-bold">
                      {transaction.type === "payIn" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${theme.colorText} opacity-70`}>
              <i className="fas fa-exchange-alt text-4xl mb-3"></i>
              <p>No transactions found</p>
              {(transactionFilter !== "all" || startDate || endDate) && (
                <SimpleButton
                  btnText="Clear Filters"
                  type="default"
                  onClick={() => {
                    setTransactionFilter("all");
                    clearDateFilters();
                  }}
                  extraClasses="mt-4"
                />
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bank Information Dialog */}
      <DialogBox
        showDialog={showBankDialog}
        setShowDialog={setShowBankDialog}
        title="Bank Information"
        type="info"
        body={
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.colorText} mb-1`}
              >
                Bank Name
              </label>
              <input
                type="text"
                value={bankForm.bankName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bankName: e.target.value })
                }
                className={`w-full p-3 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder}`}
                placeholder="e.g. HBL, UBL, etc."
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${theme.colorText} mb-1`}
              >
                Account Name
              </label>
              <input
                type="text"
                value={bankForm.accountName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountName: e.target.value })
                }
                className={`w-full p-3 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder}`}
                placeholder="Account holder name"
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium ${theme.colorText} mb-1`}
              >
                Account Number
              </label>
              <input
                type="text"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountNumber: e.target.value })
                }
                className={`w-full p-3 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder}`}
                placeholder="Account number"
              />
            </div>
          </div>
        }
        buttons={[
          {
            label: updating ? <ClipLoader size={16} color="white" /> : "Save",
            onClick: handleBankSubmit,
            type: "primary",
            disabled: updating,
          },
        ]}
      />

      {/* Payout Request Dialog */}
      <DialogBox
        showDialog={showPayoutDialog}
        setShowDialog={setShowPayoutDialog}
        title="Request Payout"
        type="info"
        body={
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.colorText} mb-1`}
              >
                Amount (PKR)
              </label>

              <input
                type="text"
                value={payoutAmount}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, "");
                  setPayoutAmount(numericValue);
                  if (useMax && numericValue !== maxValue.toString()) {
                    setUseMax(false); // auto-undo if user types something different
                  }
                }}
                className={`w-full p-3 rounded-lg ${theme.colorBg} ${theme.colorText} border ${theme.colorBorder}`}
                placeholder={`Max ${formatCurrency(maxValue)}`}
                inputMode="numeric"
                pattern="[0-9]*"
              />

              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${theme.colorText} opacity-70`}>
                  Available balance:{" "}
                  {formatCurrency(walletData?.currentBalance || 0)}
                </p>
                <SimpleButton
                  btnText={useMax ? "Max" : "Max"}
                  icon={useMax ? <FaTimes /> : <FaCoins />}
                  type={useMax ? "accent" : "default"}
                  onClick={() => {
                    if (useMax) {
                      setPayoutAmount("");
                      setUseMax(false);
                    } else {
                      setPayoutAmount(maxValue.toString());
                      setUseMax(true);
                    }
                  }}
                  extraClasses="text-xs"
                />
              </div>
            </div>

            {walletData?.bankName &&
              walletData?.accountName &&
              walletData?.accountNumber && (
                <div className={`p-4 rounded-lg ${theme.colorBg}`}>
                  <h4
                    className={`text-sm font-semibold mb-2 ${theme.colorText}`}
                  >
                    Payout will be sent to:
                  </h4>
                  <p className={`text-sm ${theme.colorText}`}>
                    {walletData.bankName}
                  </p>
                  <p className={`text-sm ${theme.colorText}`}>
                    {walletData.accountName}
                  </p>
                  <p className={`text-sm ${theme.colorText}`}>
                    {walletData.accountNumber}
                  </p>
                </div>
              )}
          </div>
        }
        buttons={[
          {
            label: updating ? (
              <ClipLoader size={16} color="white" />
            ) : (
              "Request Payout"
            ),
            onClick: handlePayoutRequest,
            type: "primary",
            disabled: updating,
          },
        ]}
      />
    </div>
  );
};

export default TailorWallet;
