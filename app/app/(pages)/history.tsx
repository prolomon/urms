import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { getTransactions } from "@/lib/services/transaction";
import { Transaction } from "@/lib/types";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function History() {
  const { currentUser, token } = useAuth();
  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [query, setQuery] = useState("");
  const router = useRouter();

  const loadTransactions = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getTransactions(
        currentUser?.uid as string,
        token as string,
        fromDate || undefined,
        toDate || undefined,
        query || undefined
      );
      const transactions = data.transactions
        ? Array.isArray(data.transactions)
          ? data.transactions
          : [data.transactions]
        : [];
      setTransactionList(transactions as Transaction[]);
    } catch (error) {
      setTransactionList([]);
    } finally {
      setRefreshing(false);
    }
  }, [token, currentUser, fromDate, toDate, query]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadTransactions} />
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
          placeholder="Search by reference..."
          placeholderTextColor="#bfc7ca"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
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
          <Text style={styles.historyStateText}>Refreshing transactions...</Text>
        ) : transactionList.length === 0 ? (
          <Text style={styles.historyStateText}>No transactions found.</Text>
        ) : (
          transactionList.slice(0, 12).map((tx) => {
            const title = tx.metadata?.transactionType || tx.event || "Transaction";
            const subtitle = tx.metadata?.narration || tx.metadata?.senderName || "";
            const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-";
            const rawStatus = tx.status || "";
            const status =
              rawStatus === "SUCCESS"
                ? "SUCCESS"
                : rawStatus === "PENDING"
                ? "PENDING"
                : rawStatus === "FAILED"
                ? "FAILED"
                : rawStatus;
            const amount = tx.amount ? formatCurrency(Number(tx.amount)) : "-";
            const color =
              status === "SUCCESS"
                ? "#14a76a"
                : status === "PENDING"
                ? "#2266ff"
                : "#e94b4b";

            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.historyCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/transaction/${tx.reference}` as RelativePathString)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{title}</Text>
                  <Text style={styles.historySub}>{subtitle}</Text>
                  <Text style={styles.historyDate}>{date}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.historyAmount}>{amount}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: color }]}> 
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
