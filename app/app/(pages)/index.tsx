import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Transaction, TransactionStatus } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
import { RelativePathString, useRouter } from "expo-router";
import {
  ArrowLeftRight,
  Bell,
  Copy,
  Eye,
  EyeOff,
  HandCoins,
  History,
  User
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, token } = useAuth();

  const displayName = currentUser?.fullname?.split(" ")[0] + " " + currentUser?.fullname?.split(" ")[1];
  const [accountCopied, setAccountCopied] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { wallet, toggleHide, hide, refresh, getTransactions, setUid } = useWallet();
  const walletBalance = Number(wallet?.balance || 0);
  const walletAccountNo = wallet?.accountNo || 0;
  const walletBank = wallet?.bank?.name || "-";

  const loadVerifyWallet = useCallback(async () => {
    setUid(currentUser?.uid || "");
    if (!wallet) {
      router.push("/complete" as RelativePathString);
      return;
    }

  }, [router, wallet]);

  useEffect(() => {
    loadVerifyWallet();
  }, [loadVerifyWallet]);

  const handleCopyAccountNumber = async () => {
    if (!wallet?.accountNo) return;
    await Clipboard.setStringAsync(wallet.accountNo);
    setAccountCopied(true);
    setTimeout(() => setAccountCopied(false), 1600);
  };

  const loadTransactions = useCallback(async () => {
    try {
      const userId = currentUser?.id || currentUser?.uid;
      if (!userId || !wallet) {
        setTransactions([]);
        return;
      }

      setHistoryLoading(true);

      const data = await getTransactions(currentUser.uid || "", token);

      console.log(data)

      setTransactions(data?.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [currentUser?.id, currentUser?.uid, getTransactions, wallet]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh?.();
      await loadTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status?: TransactionStatus) => {
    if (status === "SUCCESS") return "#0ea360";
    if (status === "PENDING") return "#f59e0b";
    if (status === "FAILED") return "#ef4444";
    return "#6b7280";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ paddingVertical: 18 }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={{ fontSize: 24, color: "#000", fontWeight: "bold" }}>{displayName}</Text>
            </View>
            <TouchableOpacity
              style={styles.avatar}
              activeOpacity={0.8}
              onPress={() => router.push("notification" as RelativePathString)}
            >
              <Bell size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <Text style={styles.walletTitle}>Wallet Balance</Text>
            <TouchableOpacity
              style={styles.walletIconButton}
              activeOpacity={0.8}
              onPress={() => toggleHide(!hide)}
            >
              {hide ? (
                <EyeOff size={20} color="#0ea360" />
              ) : (
                <Eye size={20} color="#0ea360" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.walletAmount}>
            {hide ? "₦ ••••••" : formatCurrency(walletBalance)}
          </Text>

          <View style={styles.walletBottomRow}>
            <View>
              <Text style={styles.walletAccountLabel}>Account Number</Text>
              <Text style={styles.walletAccountValue}>{walletAccountNo}</Text>
              <View style={styles.walletBorder}></View>
              <Text style={styles.walletAccountValue}>{walletBank}</Text>
            </View>

            <TouchableOpacity
              style={styles.walletIconButton}
              activeOpacity={0.8}
              onPress={handleCopyAccountNumber}
            >
              <Copy size={18} color="#0ea360" />
            </TouchableOpacity>
          </View>

          {accountCopied ? (
            <Text style={styles.walletCopiedText}>Account number copied</Text>
          ) : null}

        </View>

        <View style={{ padding: 18 }}>

          {/* quick action section */}
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000", marginBottom: 12 }}>Quick Action</Text>
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("/payment" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <HandCoins size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("agent" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <User size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>Agent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("records" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <History size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionItem}
              activeOpacity={0.8}
              onPress={() => router.push("/transfer" as RelativePathString)}
            >
              <View style={styles.quickActionIconWrap}>
                <ArrowLeftRight size={20} color="#0ea360" />
              </View>
              <Text style={styles.quickActionText}>Transfer</Text>
            </TouchableOpacity>
          </View>

          {/*  transaction history section */}
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#000", marginVertical: 12 }}>Transaction History</Text>
          <View style={styles.historyWrap}>
            {historyLoading ? (
              <Text style={styles.historyStateText}>Loading transactions...</Text>
            ) : transactions.length === 0 ? (
              <Text style={styles.historyStateText}>No transactions yet.</Text>
            ) : (
              transactions.slice(0, 6).map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.historyItem}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/transaction/${tx.reference}` as RelativePathString)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>{tx.metadata?.transactionType || tx.event || "Transaction"}</Text>
                    <Text style={styles.historySub}>{tx.metadata?.narration || tx.metadata?.senderName || "-"}</Text>
                    <Text style={styles.historyDate}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyAmount}>{formatCurrency(Number(tx.amount || 0))}</Text>
                    <Text style={[styles.historyStatus, { color: getStatusColor(tx.status) }]}>
                      {String(tx.status)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  content: { paddingBottom: 40 },
  headerCard: {
    marginHorizontal: 18,
  },
  headerCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: { fontSize: 18, color: "#0ea360", fontWeight: "bold" },
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 16,
  },
  quickActionItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "24%",
  },
  quickActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6f9f0",
    borderWidth: 1,
    borderColor: "#d4f5e6",
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },
  historyWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6f9f0",
    padding: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  historySub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  historyStatus: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  historyStateText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 16,
  },
  accountText: { marginTop: 4, color: "#222", fontSize: 18, fontWeight: "600" },
  walletBorder: {
    marginVertical: 8,
    height: 1,
    backgroundColor: "#e6f9f0",
    alignSelf: "stretch",
  },
  walletCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: "#0ea360",
    padding: 18,
    shadowColor: "#0ea360",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e6f9f0",
  },
  walletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletTitle: {
    fontSize: 13,
    letterSpacing: 1,
    color: "#fff",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  walletAmount: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
  },
  walletAccountLabel: {
    fontSize: 14,
    color: "#fff",
    // marginBottom: 2,
  },
  walletAccountValue: {
    fontSize: 18,
    letterSpacing: 1,
    color: "#fff",
    fontWeight: "700",
  },
  walletIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c6f2dc",
  },
  walletCopiedText: {
    marginTop: 10,
    color: "#0ea360",
    fontSize: 12,
    fontWeight: "600",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f9f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0ea360",
    shadowColor: "#0ea360",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  uidCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 18,
    marginTop: 18,
    flexDirection: "column",
    shadowColor: "#0ea360",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: "stretch",
  },
  uidLabel: {
    fontSize: 12,
    color: "#0ea360",
    fontWeight: "bold",
    marginBottom: 2,
    letterSpacing: 1.2,
  },
  uidRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uidValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    letterSpacing: 1.1,
  },
  copyBtn: {
    backgroundColor: "#e6f9f0",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 10,
  },
  copyBtnText: {
    color: "#0ea360",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});
