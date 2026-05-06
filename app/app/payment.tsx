import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getPayments } from "@/lib/services/member";
import { Payment } from "@/lib/types";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
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

export default function MakePayment() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { failed } = useToast();

  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  const formatAmount = (value: number) =>
    value.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  };

  const fetchPayments = useCallback(async () => {
    try {
      if (!currentUser?.uid) {
        setAllPayments([]);
        return;
      }

      setLoadingPayments(true);
      const data = await getPayments(currentUser.uid);

      if (data.ok && data.payments) {
        setAllPayments(data.payments);
      } else {
        setAllPayments([]);
        failed(data.message || "Failed to fetch payments");
      }
    } catch (error: any) {
      setAllPayments([]);
      failed(error.message || "An error occurred while fetching payments");
    } finally {
      setLoadingPayments(false);
    }
  }, [currentUser?.uid, failed]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const handlePayNow = () => {
    // Intentionally blank for now.
    console.log("handlePayNow called", {
      payment: selectedPayment,
      amount: paymentAmount,
    });
  };

  const sortedPayments = [...allPayments].sort((left, right) => {
    const leftDate = new Date(left.due || left.date).getTime();
    const rightDate = new Date(right.due || right.date).getTime();
    return rightDate - leftDate;
  });

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
            <Text style={[styles.headerTitle, { color: "#000" }]}>Make Payment</Text>
            <View style={{ width: 32 }} />
          </View>
        </View>

        {loadingPayments ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#0ea360" />
          </View>
        ) : sortedPayments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payments found</Text>
            <Text style={styles.emptyText}>
              Your payment history will appear here.
            </Text>
          </View>
        ) : (
          <View style={{ marginHorizontal: 14, marginTop: 12 }}>
            {sortedPayments.map((payment, index) => (
              <View
                key={payment.reference || `${payment.userId}-${index}`}
                style={styles.paymentCard}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.paymentTitle}>
                    {payment.payment || "Payment"}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    Reference: {payment.reference}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    Amount: {formatAmount(Number(payment.amount) || 0)}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    Due: {formatDate(payment.due)}
                  </Text>
                  <Text style={styles.paymentMeta}>
                    Status: {payment.status}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.payNowButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedPayment(payment);
                    setPaymentAmount(String(payment.amount || ""));
                    setShowPaymentModal(true);
                  }}
                >
                  <Text style={styles.payNowText}>Pay</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Modal visible={showPaymentModal} animationType="slide">
          <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeButton}>✕ Close</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.modalTitle}>
                {selectedPayment?.payment || "Payment Details"}
              </Text>
              <Text style={styles.modalMeta}>
                Reference: {selectedPayment?.reference || "N/A"}
              </Text>
              <Text style={styles.modalMeta}>
                Amount: {selectedPayment ? formatAmount(Number(selectedPayment.amount) || 0) : "-"}
              </Text>
              <Text style={styles.modalMeta}>
                Due: {formatDate(selectedPayment?.due)}
              </Text>
              <Text style={styles.modalMeta}>
                Status: {selectedPayment?.status || "N/A"}
              </Text>
              <Text style={styles.modalMeta}>
                Debt: {selectedPayment ? formatAmount(Number(selectedPayment.debt) || 0) : "-"}
              </Text>

              <TextInput
                style={[styles.amountInput, { marginTop: 12 }]}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={(text) => setPaymentAmount(text.replace(/[^0-9]/g, ""))}
              />

              <View style={{ flexDirection: "row", marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.proceedButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => {
                    handlePayNow();
                    setShowPaymentModal(false);
                  }}
                >
                  <Text style={[styles.proceedText, { color: "#fff" }]}>Pay Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.proceedButtonDisabled,
                    { flex: 1, alignItems: "center", justifyContent: "center" },
                  ]}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={{ color: "#fff" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  headerTitle: { fontSize: 18 },
  loadingCard: {
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#eaf9f0",
    borderWidth: 1,
    borderColor: "#d9f0e3",
  },
  emptyCard: {
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f3",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  emptyText: { marginTop: 6, fontSize: 13, color: "#64748b" },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eef2f3",
    flexDirection: "row",
    alignItems: "center",
  },
  paymentTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  paymentMeta: { marginTop: 4, fontSize: 12, color: "#64748b" },
  payNowButton: {
    backgroundColor: "#0ea360",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  payNowText: { color: "#fff", fontWeight: "700" },
  modalHeader: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: { fontSize: 16, color: "#0ea360" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#0f172a" },
  modalMeta: { marginBottom: 6, color: "#334155" },
  amountInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  proceedButton: {
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
});