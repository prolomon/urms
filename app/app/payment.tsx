import { BusinessType, useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function MakePayment() {
  const router = useRouter();
  const { success, failed } = useToast();
  const [showWebView, setShowWebView] = useState<boolean>(false);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [pricing, setPricing] = useState<BusinessType[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enteredAmount, setEnteredAmount] = useState<string>("");
  const [payType, setPayType] = useState<"current" | "old">("current");
  const {
    currentUser,
    createPayment,
    payments,
    getBusiness,
    setDueBalance,
    setBalance,
  } = useAuth();
  const [userDueDate, setUserDueDate] = useState<Date | null>(null);

  const MINIMUM_AMOUNT = 1000;

  const fetchData = async () => {
    const paymentsList = await payments();
    setAllPayments(paymentsList || []);
    await fetchPricing();
    setUserDueDate(currentUser?.due ? new Date(currentUser.due) : null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true);
      const response = await getBusiness();
      if (response && Array.isArray(response)) {
        setPricing(response);
      }
    } catch (error) {
      failed("Failed to load pricing");
    } finally {
      setLoadingPricing(false);
    }
  };

  const frequencyMultipliers: Record<string, number> = {
    MONTHLY: 1,
    QUARTERLY: 3,
    YEARLY: 12,
  };

  const frequencyToDays: Record<string, number> = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
  };

  const paymentPlanName = pricing.find(
    (type) => type.id === currentUser?.businessType,
  );

  const basePrice = Number(
    pricing.find((type) => type.id === currentUser?.businessType)?.price ||
      "15000",
  );

  const multiplier =
    frequencyMultipliers[
      currentUser?.billingFrequency?.toUpperCase() ?? "MONTHLY"
    ] ?? 1;
  const nextPaymentAmount = basePrice * multiplier;

  // Compute the latest payment once and reuse
  const lastPaymentRecord =
    allPayments.length === 0
      ? null
      : allPayments.reduce((latest: any, payment: any) => {
          const paymentDate = new Date(payment.due || payment.date);
          return paymentDate > new Date(latest.due || latest.date)
            ? payment
            : latest;
        }, allPayments[0]);

  const totalOwed = currentUser?.balance || 0;

  // Determine payment amount based on payType
  const paymentAmount = enteredAmount
    ? Number(enteredAmount)
    : payType === "old"
      ? totalOwed
      : nextPaymentAmount;
  const amountKobo = paymentAmount * 100;
  const formatAmount = (value: number) =>
    value.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

  const daysForFrequency =
    frequencyToDays[
      currentUser?.billingFrequency?.toUpperCase() ?? "MONTHLY"
    ] ?? 30;

  // Memoize due date calculation to prevent unnecessary recalculations on balance changes
  const { dueDateObj, dueDate } = useMemo(() => {
    let dateObj: Date;
    let dateString = "";

    // Prefer backend-provided due date
    if (currentUser?.due) {
      dateObj = new Date(currentUser.due);
      dateString = dateObj.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (allPayments.length === 0) {
      // No payments and no backend due, use creation date
      const createdDate = new Date(
        currentUser?.createdAt || Date.now(),
      ).getTime();
      const dueDateMs = createdDate + daysForFrequency * 24 * 60 * 60 * 1000;
      dateObj = new Date(dueDateMs);
      dateString = dateObj.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      // Payments exist and no backend due, calculate from last payment
      const currentDueDate = new Date(lastPaymentRecord?.due).getTime();
      const nextDueDateMs =
        currentDueDate + daysForFrequency * 24 * 60 * 60 * 1000;
      dateObj = new Date(nextDueDateMs);
      dateString = dateObj.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    return { dueDateObj: dateObj, dueDate: dateString };
  }, [
    currentUser?.due,
    currentUser?.createdAt,
    allPayments,
    lastPaymentRecord?.due,
    daysForFrequency,
  ]);

  // Check if user has paid all outstanding and hasn't reached due date yet
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPaid = currentUser?.dueBalance === 0 && today < dueDateObj;

  const handlePayment = () => {
    const amount = Number(enteredAmount);

    if (amount < MINIMUM_AMOUNT) {
      failed(`Minimum payment amount is ${formatAmount(MINIMUM_AMOUNT)}`);
      return;
    }

    if (amount > nextPaymentAmount) {
      failed(`Amount cannot exceed ${formatAmount(nextPaymentAmount)}`);
      return;
    }

    setShowWebView(true);
  };

  const paystackHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </head>
    <body>
      <script>
        const paystack = PaystackPop.setup({
          key: 'pk_test_446e67e4bfed09a1fbafcd6432efcdbc3207424b',
          email: '${currentUser?.email || ""}',
          amount: ${amountKobo},
          ref: 'RCP-${Date.now()}',
          currency: 'NGN',
          metadata: {
            custom_fields: [
              {
                display_name: "Customer Name",
                variable_name: "customer_name",
                value: '${currentUser?.fullname || "Customer"}'
              },
              {
                display_name: "User ID",
                variable_name: "user_id",
                value: '${currentUser?.uid || "N/A"}'
              },
              {
                display_name: "Phone",
                variable_name: "phone",
                value: '${currentUser?.phone || "N/A"}'
              },
              {
                display_name: "Business Type",
                variable_name: "business_type",
                value: '${currentUser?.businessType || "N/A"}'
              },
              {
                display_name: "Billing Frequency",
                variable_name: "billing_frequency",
                value: '${currentUser?.billingFrequency || "N/A"}'
              }
            ]
          },
          onClose: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancelled' }));
          },
          callback: function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', reference: response.reference }));
          }
        });
        paystack.openIframe();
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setShowWebView(false);
      if (data.status === "success") {
        // Use new Date() if paying owed balance, otherwise use dueDateObj
        const paymentDueDate =
          paymentAmount === totalOwed ? new Date() : dueDateObj;

        const result = await createPayment(
          data.reference,
          paymentAmount,
          "Payment Gateway",
          "SUCCESS",
          paymentDueDate,
        );

        if (result.ok) {
          if (payType === "old") {
            // If paying old debt, reduce balance by payment amount
            const newBalance = (currentUser?.balance || 0) - paymentAmount;
            await setBalance(newBalance < 0 ? 0 : newBalance);
          } else {
            if (
              Number(currentUser?.dueBalance) === 0 ||
              currentUser?.dueBalance == null
            ) {
              if (paymentAmount !== nextPaymentAmount) {
                await setDueBalance(Number(nextPaymentAmount - paymentAmount));
              } else {
                await setDueBalance(0);
              }
            } else {
              const newDueBalance =
                Number(currentUser?.dueBalance) - paymentAmount;
              await setDueBalance(newDueBalance < 0 ? 0 : newDueBalance);
            }
            // If user didn't pay full next payment, update due balance
          }

          success(`Payment successful! Reference: ${data.reference}`);

          setEnteredAmount("");
          router.push(`/receipt/${data.reference}` as RelativePathString);
        } else {
          failed(result.message || "Failed to save payment record");
        }
      } else if (data.status === "cancelled") {
        failed("Payment was cancelled.");
      }
    } catch (error) {
      failed("An error occurred during payment processing.");
      console.error("Payment error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.safe}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.back}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#000" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: "#000" }]}>
              Make Payment
            </Text>
            <View style={{ width: 32 }} />
          </View>
        </View>

        {loadingPricing ? (
          <View style={styles.summaryCard}>
            <ActivityIndicator size="small" color="#0ea360" />
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryMonth}>{dueDate}</Text>
            <Text style={styles.summaryLabel}>
              {paymentPlanName?.title} Fee
            </Text>
            {isPaid ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={[styles.summaryAmount, { color: "#0ea360" }]}>
                  Paid
                </Text>
                <Text style={{ fontSize: 20, color: "#0ea360" }}>✓</Text>
              </View>
            ) : (
              <Text style={styles.summaryAmount}>
                {currentUser?.dueBalance === 0 ||
                currentUser?.dueBalance == null
                  ? formatAmount(nextPaymentAmount)
                  : formatAmount(currentUser?.dueBalance)}
              </Text>
            )}
          </View>
        )}

        {totalOwed > 0 && (
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Outstanding Balance:</Text>
              <Text style={styles.balanceAmount}>
                {formatAmount(currentUser?.dueBalance || 0)}
              </Text>
            </View>
            <View style={[styles.balanceRow, { marginTop: 8 }]}>
              <Text style={styles.totalLabel}>Total Amount Owed:</Text>
              <Text style={styles.totalAmount}>
                {formatAmount(totalOwed + (currentUser?.dueBalance || 0))}
              </Text>
            </View>
          </View>
        )}

        <View>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Select Payment Type</Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity
                style={[
                  styles.radioOuter,
                  payType === "current" && styles.radioSelected,
                  { marginRight: 16 },
                ]}
                onPress={() => {
                  setPayType("current");
                  setEnteredAmount("");
                }}
                activeOpacity={0.7}
              >
                {payType === "current" && <View style={styles.radioInner} />}
              </TouchableOpacity>
              <Text style={{ marginRight: 24, alignSelf: "center" }}>
                Current Due
              </Text>
              <TouchableOpacity
                style={[
                  styles.radioOuter,
                  payType === "old" && styles.radioSelected,
                  { marginRight: 16 },
                ]}
                onPress={() => {
                  setPayType("old");
                  setEnteredAmount("");
                }}
                activeOpacity={0.7}
              >
                {payType === "old" && <View style={styles.radioInner} />}
              </TouchableOpacity>
              <Text style={{ alignSelf: "center" }}>Old Due Debt</Text>
            </View>
            <Text style={styles.amountLabel}>Payment Amount</Text>
            <Text style={styles.amountHint}>
              {payType === "old"
                ? `Total owed: ${formatAmount(totalOwed)}`
                : currentUser?.dueBalance === 0
                  ? "You're up to date—no balance due"
                  : `Total due: ${formatAmount(currentUser?.dueBalance || 0)}`}
            </Text>
            <TextInput
              style={styles.amountInput}
              placeholder={
                payType === "old"
                  ? `Enter amount (min: 1000 - max: ${formatAmount(totalOwed)})`
                  : `Enter amount (min: 1000 - max: ${formatAmount(nextPaymentAmount)})`
              }
              placeholderTextColor="#9aa3aa"
              keyboardType="numeric"
              value={enteredAmount}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, "");
                setEnteredAmount(numericText);
              }}
            />
            {enteredAmount && Number(enteredAmount) < MINIMUM_AMOUNT && (
              <Text style={styles.errorText}>
                Minimum payment amount is {formatAmount(MINIMUM_AMOUNT)}
              </Text>
            )}
            {enteredAmount &&
              ((payType === "old" && Number(enteredAmount) > totalOwed) ||
                (payType === "current" &&
                  Number(enteredAmount) > nextPaymentAmount)) && (
                <Text style={styles.errorText}>
                  Amount cannot exceed{" "}
                  {formatAmount(
                    payType === "old" ? totalOwed : nextPaymentAmount,
                  )}
                </Text>
              )}
            {enteredAmount &&
              payType === "current" &&
              Number(enteredAmount) >= MINIMUM_AMOUNT &&
              Number(enteredAmount) < nextPaymentAmount && (
                <Text style={styles.infoText}>
                  Remaining:{" "}
                  {formatAmount(nextPaymentAmount - Number(enteredAmount))} will
                  be added to your balance
                </Text>
              )}
          </View>

          <TouchableOpacity
            style={[
              styles.proceedButton,
              (!enteredAmount ||
                (payType === "old" && Number(enteredAmount) > totalOwed) ||
                (payType === "current" &&
                  Number(enteredAmount) > nextPaymentAmount) ||
                Number(enteredAmount) < MINIMUM_AMOUNT) &&
                styles.proceedButtonDisabled,
            ]}
            activeOpacity={0.9}
            onPress={handlePayment}
            disabled={
              !enteredAmount ||
              (payType === "old" && Number(enteredAmount) > totalOwed) ||
              (payType === "current" &&
                Number(enteredAmount) > nextPaymentAmount) ||
              Number(enteredAmount) < MINIMUM_AMOUNT
            }
          >
            <Text style={[styles.proceedText, { color: "#fff" }]}>
              🔒 Pay
              {enteredAmount
                ? formatAmount(Number(enteredAmount))
                : formatAmount(
                    payType === "old" ? totalOwed : nextPaymentAmount,
                  )}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showWebView} animationType="slide">
          <View style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowWebView(false)}>
                <Text style={styles.closeButton}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: paystackHTML }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f9" },
  container: { paddingBottom: 40 },
  header: { paddingVertical: 22, paddingHorizontal: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18 },
  headerTitle: { fontSize: 18 },

  summaryCard: {
    marginHorizontal: 14,
    marginTop: 0,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#eaf9f0",
    borderWidth: 1,
    borderColor: "#d9f0e3",
  },
  summaryMonth: { fontSize: 18, marginBottom: 6, color: "#0b6d4b" },
  summaryLabel: {
    color: "#2f8f65",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  summaryAmount: { fontSize: 20, color: "#06472f", fontWeight: "700" },

  balanceCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    marginTop: 12,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#856404",
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 16,
    color: "#856404",
    fontWeight: "600",
  },
  totalLabel: {
    fontSize: 15,
    color: "#856404",
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 18,
    color: "#856404",
    fontWeight: "700",
  },

  sectionLabel: { marginBottom: 10, color: "#334349" },
  methodItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eef2f3",
  },
  methodLeft: { flexDirection: "row", alignItems: "center" },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cfd8d9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0ea360",
  },
  radioSelected: { borderColor: "#0ea360" },
  methodIcon: { width: 22, height: 22, marginRight: 12 },
  methodLabel: { fontSize: 15 },

  amountSection: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eef2f3",
    marginHorizontal: 14,
  },
  amountLabel: {
    fontSize: 15,
    color: "#334349",
    marginBottom: 4,
    fontWeight: "600",
  },
  amountHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
  amountInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
  },
  infoText: {
    color: "#0ea360",
    fontSize: 12,
    marginTop: 6,
  },

  proceedButton: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: "#0ea360",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  proceedButtonDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.6,
  },
  proceedText: { color: "#fff", fontSize: 16 },
  modalHeader: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    fontSize: 16,
    color: "#0ea360",
  },
});
