import { formatCurrency } from "@/config";
import { Transaction } from "@/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    // Replace real fetch with static dummy data for testing
    const dummy: Transaction = {
      id: id || "txn_dummy",
      status: "SUCCESS",
      amount: "2500",
      fixedCharge: "50",
      source: "POS",
      type: "PAYMENT",
      customerBillerId: "",
      timeCreated: new Date().toISOString(),
      timeUpdated: new Date().toISOString(),
      posTid: "",
      posSerialNumber: "",
      walletCurrency: "NGN",
      walletBalance: "10000",
      billingVendorReference: "BILLREF123",
      paymentVendorReference: "PAYREF123",
      userId: "user_1",
      ktaSenderName: "John Doe",
      ktaSenderAccountNumber: "",
      ktaSenderBankCode: "",
      recipientAccountNumber: "1234567890",
      recipientAccountType: "SAVINGS",
      senderName: "John Doe",
      currency: "NGN",
      bankCode: "001",
      productId: "",
      isAgentTransaction: true,
      isInternational: false,
      customerCommission: "0",
      recipientAccountName: "Jane Doe",
      sessionId: "",
      accountNumber: "1234567890",
      bankName: "Demo Bank",
      entryType: "CREDIT",
      transactionCategory: "SALE",
      narration: "Payment for goods",
      receiptTerminalId: "",
    } as Transaction;

    setTransaction(dummy);
    setLoading(false);
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator color="#0ea360" size="large" />
          <Text style={styles.stateText}>Loading transaction...</Text>
        </View>
      ) : !transaction ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>Transaction not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{transaction.narration || transaction.transactionCategory || "-"}</Text>

            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{transaction.paymentVendorReference || transaction.billingVendorReference || "-"}</Text>

            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(Number(transaction.amount || 0))}</Text>

            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{String(transaction.status || "-")}</Text>

            <Text style={styles.label}>Channel</Text>
            <Text style={styles.value}>{transaction.source || "-"}</Text>

            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {(transaction.timeCreated || transaction.timeUpdated) ? new Date(transaction.timeCreated || transaction.timeUpdated).toLocaleString() : "-"}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    padding: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6f9f0",
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 10,
  },
  value: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "700",
    marginTop: 2,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  stateText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
});
