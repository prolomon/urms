import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { getRecords } from "@/lib/services/payment";
import { PaymentTransaction, TransactionStatus } from "@/lib/types";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft, CreditCard } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function PaymentTransactions() {
  const router = useRouter();
  const { currentUser, token } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      if (!currentUser?.uid) {
        setTransactions([]);
        return;
      }

      setLoadingTransactions(true);
      setError("");
      const data = await getRecords(currentUser.uid, token as string);

      if (data.ok && data.transactions) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
        setError(data.message || "Failed to fetch payment transactions");
      }
    } catch (err: any) {
      setTransactions([]);
      setError(err?.message || "An error occurred while fetching payment transactions");
    } finally {
      setLoadingTransactions(false);
    }
  }, [currentUser?.uid, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const filteredTransactions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const sorted = [...transactions].sort((left, right) => {
      const leftDate = new Date(left.createdAt).getTime();
      const rightDate = new Date(right.createdAt).getTime();
      return rightDate - leftDate;
    });

    if (!trimmed) return sorted;

    return sorted.filter((item) => {
      const searchable = [
        item.reference,
        item.name,
        item.category,
        item.type,
        item.billing,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(trimmed);
    });
  }, [transactions, query]);

  const totalAmount = filteredTransactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const successCount = filteredTransactions.filter(
    (item) => item.status === "SUCCESS"
  ).length;

  const pendingCount = filteredTransactions.filter(
    (item) => item.status === "PENDING"
  ).length;

  const getStatusStyles = (status?: TransactionStatus) => {
    if (status === "SUCCESS") {
      return { badge: styles.statusSuccess, text: styles.statusTextSuccess };
    }

    if (status === "PENDING") {
      return { badge: styles.statusPending, text: styles.statusTextPending };
    }

    if (status === "FAILED") {
      return { badge: styles.statusFailed, text: styles.statusTextFailed };
    }

    return { badge: styles.statusNeutral, text: styles.statusTextNeutral };
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("en-NG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  return (
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
          <Text style={[styles.headerTitle, { color: "#000" }]}>Payment Transactions</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrap}>
          <CreditCard size={20} color="#0ea360" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryTitle}>Transaction Overview</Text>
          <Text style={styles.summaryText}>
            {filteredTransactions.length} records available for review.
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{filteredTransactions.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{successCount}</Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search by reference, name, category..."
          placeholderTextColor="#bfc7ca"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loadingTransactions ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color="#0ea360" />
          <Text style={styles.loadingText}>Loading payment transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Unable to load transactions</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No payment transactions found</Text>
          <Text style={styles.emptyText}>
            Use the search box to find a transaction or pull to refresh.
          </Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
          </View>

          {filteredTransactions.map((item, index) => {
            const statusStyles = getStatusStyles(item.status);

            return (
              <TouchableOpacity
                key={item.id || item.reference || `${index}`}
                style={styles.paymentCard}
                activeOpacity={0.9}
                onPress={() =>
                  router.push(`/receipt/${item.reference}` as RelativePathString)
                }
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.planLabel} numberOfLines={1}>
                      {item.name || item.type || "Payment Transaction"}
                    </Text>
                    <Text style={styles.paymentMeta} numberOfLines={1}>
                      {item.category || item.billing || "Transaction record"}
                    </Text>
                    <Text style={styles.paymentMeta} numberOfLines={1}>
                      Reference: {item.reference}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, statusStyles.badge]}>
                    <Text style={[styles.statusText, statusStyles.text]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountGrid}>
                  <View style={styles.amountBadge}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>
                      {formatCurrency(Number(item.amount || 0))}
                    </Text>
                  </View>
                  <View style={styles.debtBadge}>
                    <Text style={styles.debtLabel}>Date</Text>
                    <Text style={styles.debtValue}>{formatDate(item.date)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: "700" },
  summaryCard: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6f4ec",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  summaryText: { marginTop: 4, color: "#64748b", fontSize: 13 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  statLabel: { marginTop: 2, color: "#64748b", fontSize: 12, fontWeight: "600" },
  searchWrap: { paddingHorizontal: 14, marginBottom: 8 },
  searchInput: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eceff0",
  },
  loadingCard: {
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#eaf9f0",
    borderWidth: 1,
    borderColor: "#d9f0e3",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  loadingText: { color: "#0f172a", fontSize: 13, fontWeight: "600" },
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
  listWrap: { paddingHorizontal: 14, marginTop: 2 },
  totalCard: {
    backgroundColor: "#0ea360",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  totalLabel: { color: "#d1fae5", fontSize: 12, fontWeight: "700" },
  totalValue: { marginTop: 4, color: "#fff", fontSize: 24, fontWeight: "800" },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "column",
    gap: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  planLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
  paymentMeta: { marginTop: 4, fontSize: 13, color: "#64748b", lineHeight: 18 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  statusSuccess: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  statusPending: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  statusFailed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusNeutral: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  statusTextSuccess: { color: "#166534" },
  statusTextPending: { color: "#1d4ed8" },
  statusTextFailed: { color: "#b91c1c" },
  statusTextNeutral: { color: "#334155" },
  amountGrid: { flexDirection: "row", gap: 10 },
  amountBadge: {
    flex: 1,
    backgroundColor: "#dcfce7",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0ea360",
  },
  amountLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
  amountValue: { fontSize: 16, color: "#0ea360", fontWeight: "700", marginTop: 2 },
  debtBadge: {
    flex: 1,
    backgroundColor: "#eef2ff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  debtLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
  debtValue: { fontSize: 14, color: "#3730a3", fontWeight: "700", marginTop: 2 },
});
