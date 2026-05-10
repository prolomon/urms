import { Payment, useAuth } from "@/hooks/use-auth";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getTransactions } from "@/lib/services/transaction";

export default function History() {
  const { payments, currentUser } = useAuth();
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const router = useRouter();

  const loadPayments = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTransactions(currentUser?.uid);
      setPaymentList(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (error) {
      setPaymentList([]);
    } finally {
      setRefreshing(false);
    }
  }, [payments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    if (!fromDate && !toDate) return paymentList;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return paymentList.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [paymentList, fromDate, toDate]);

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadPayments} />
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
            Payment History
          </Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search payments..."
          placeholderTextColor="#bfc7ca"
          style={styles.searchInput}
        />
        <View style={styles.rangeRow}>
          <TextInput
            placeholder="From (YYYY-MM-DD)"
            placeholderTextColor="#bfc7ca"
            style={styles.rangeInput}
            value={fromDate}
            onChangeText={setFromDate}
          />
          <TextInput
            placeholder="To (YYYY-MM-DD)"
            placeholderTextColor="#bfc7ca"
            style={styles.rangeInput}
            value={toDate}
            onChangeText={setToDate}
          />
        </View>
      </View>

      <View style={styles.historyWrap}>
        {refreshing ? (
          <Text style={styles.historyStateText}>
            Refreshing transactions...
          </Text>
        ) : filteredPayments.length === 0 ? (
          <Text style={styles.historyStateText}>No transactions found.</Text>
        ) : (
          filteredPayments.slice(0, 12).map((tx) => {
            const title = tx.businessName || "Payment";
            const subtitle = tx.frequency || tx.payment || "";
            const date = tx.date ? new Date(tx.date).toLocaleDateString() : "-";
            const rawStatus = tx.status || "";
            const status =
              rawStatus === "SUCCESS"
                ? "Paid"
                : rawStatus === "PENDING"
                ? "Pending"
                : rawStatus === "FAILED"
                ? "Failed"
                : rawStatus;
            const amount = tx.amount
              ? `₦${Number(tx.amount).toLocaleString()}`
              : "-";
            const color =
              status === "Paid"
                ? "#14a76a"
                : status === "Pending"
                ? "#2266ff"
                : "#e94b4b";

            return (
              <TouchableOpacity
                key={tx.reference}
                style={styles.historyCard}
                activeOpacity={0.9}
                onPress={() =>
                  router.push(`/receipt/${tx.reference}` as RelativePathString)
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{title}</Text>
                  <Text style={styles.historySub}>{subtitle}</Text>
                  <Text style={styles.historyDate}>{date}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.historyAmount}>{amount}</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: color }]}
                  >
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f9" },
  container: { paddingBottom: 40 },
  header: { paddingVertical: 14, paddingHorizontal: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18 },
  headerTitle: { color: "#fff", fontSize: 18 },

  searchWrap: { paddingHorizontal: 14 },
  searchInput: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eceff0",
  },
  rangeRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  rangeInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#eceff0",
  },

  historyWrap: {
    padding: 16,
  },
  historyStateText: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginVertical: 20,
  },
  historyCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  historySub: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  historyDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  statusBadge: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});
