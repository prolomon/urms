import { formatCurrency } from "@/config";
import { getTransaction } from "@/lib/services/transaction";
import { Transaction } from "@/lib/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
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

  const loadTransaction = useCallback(async () => {
    try {
      if (!id) {
        setTransaction(null);
        return;
      }

      const data = await getTransaction(id);
      setTransaction(data?.transactions || null);
    } catch {
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

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
            <Text style={styles.label}>Event</Text>
            <Text style={styles.value}>{transaction.event || "-"}</Text>

            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{transaction.reference || "-"}</Text>

            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatCurrency(Number(transaction.amount || 0))}</Text>

            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{String(transaction.status || "-")}</Text>

            <Text style={styles.label}>Channel</Text>
            <Text style={styles.value}>{transaction.channel || "-"}</Text>

            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "-"}
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
