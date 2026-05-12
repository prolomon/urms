import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { getTransaction } from "@/lib/services/transaction";
import { Transaction, TransactionStatus } from "@/lib/types";
import * as Clipboard from "expo-clipboard";
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

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch transaction from API using the transaction ID
      const response = await getTransaction(String(id), token as string);

      if (response.transaction) {
        const data = response.transaction;
        setTransaction(data || data);
      } else {
        setTransaction(null);
      }
    } catch (error) {
      console.error("Error loading transaction:", error);
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id, loadTransaction]);

  const handleCopyToClipboard = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const getStatusColor = (status?: TransactionStatus) => {
    if (status === "SUCCESS") return "#0ea360";
    if (status === "PENDING") return "#f59e0b";
    if (status === "FAILED") return "#ef4444";
    return "#6b7280";
  };

  const getStatusBgColor = (status?: TransactionStatus) => {
    if (status === "SUCCESS") return "#ecfdf5";
    if (status === "PENDING") return "#fffbeb";
    if (status === "FAILED") return "#fef2f2";
    return "#f3f4f6";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea360" />
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tx = transaction;
  const meta = tx.metadata || {};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(tx.status) },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: getStatusColor(tx.status) },
              ]}
            >
              {tx.status}
            </Text>
          </View>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            {meta.transactionType === "CREDIT" ? "Received" : "Sent"}
          </Text>
          <Text style={styles.amountValue}>
            {formatCurrency(Number(tx.amount || 0))}
          </Text>
          <Text style={styles.currencyText}>{tx.currency || "NGN"}</Text>
        </View>

        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {meta.transactionType || meta.transactionTypeName || "Transfer"}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.borderBottom]}>
            <Text style={styles.detailLabel}>Reference</Text>
            <TouchableOpacity
              onPress={() => handleCopyToClipboard(tx.reference)}
              activeOpacity={0.8}
            >
              <Text style={styles.detailValueLink}>{tx.reference}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sender/Receiver Information */}
        {meta.senderName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {meta.transactionType === "CREDIT" ? "From" : "To"}
            </Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{meta.senderName}</Text>
            </View>
            {meta.senderBankName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank</Text>
                <Text style={styles.detailValue}>{meta.senderBankName}</Text>
              </View>
            )}
            {meta.senderAccountNumber && (
              <View style={[styles.detailRow, styles.borderBottom]}>
                <Text style={styles.detailLabel}>Account</Text>
                <TouchableOpacity
                  onPress={() => handleCopyToClipboard(meta.senderAccountNumber)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailValueLink}>
                    {meta.senderAccountNumber}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Receiver Account Info */}
        {meta.aliasAccountName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>To Account</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Name</Text>
              <Text style={styles.detailValue}>{meta.aliasAccountName}</Text>
            </View>
            {meta.aliasAccountNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <TouchableOpacity
                  onPress={() => handleCopyToClipboard(meta.aliasAccountNumber)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailValueLink}>
                    {meta.aliasAccountNumber}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {meta.aliasAccountType && (
              <View style={[styles.detailRow, styles.borderBottom]}>
                <Text style={styles.detailLabel}>Account Type</Text>
                <Text style={styles.detailValue}>{meta.aliasAccountType}</Text>
              </View>
            )}
          </View>
        )}

        {/* Narration/Description */}
        {meta.narration && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.narrationBox}>
              <Text style={styles.narrationText}>{meta.narration}</Text>
            </View>
          </View>
        )}

        {/* Date & Time Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {tx.createdAt
                ? new Date(tx.createdAt).toLocaleString()
                : "-"}
            </Text>
          </View>
          {meta.time && (
            <View style={[styles.detailRow, styles.borderBottom]}>
              <Text style={styles.detailLabel}>Transaction Time</Text>
              <Text style={styles.detailValue}>
                {new Date(meta.time).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          {tx.gatewayResponse && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Response</Text>
              <Text style={styles.detailValue}>{tx.gatewayResponse}</Text>
            </View>
          )}
          {tx.channel && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Channel</Text>
              <Text style={styles.detailValue}>{tx.channel}</Text>
            </View>
          )}
          {meta.sessionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Session ID</Text>
              <TouchableOpacity
                onPress={() => handleCopyToClipboard(meta.sessionId)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailValueLink}>{meta.sessionId}</Text>
              </TouchableOpacity>
            </View>
          )}
          {meta.requestId && (
            <View style={[styles.detailRow, styles.borderBottom]}>
              <Text style={styles.detailLabel}>Request ID</Text>
              <TouchableOpacity
                onPress={() => handleCopyToClipboard(meta.requestId)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailValueLink}>{meta.requestId}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Copy Feedback */}
        {copied && (
          <View style={styles.copiedNotification}>
            <Text style={styles.copiedText}>Copied to clipboard</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  content: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  statusSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  amountCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0ea360",
    marginBottom: 4,
  },
  currencyText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
    flex: 0.4,
  },
  detailValue: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "500",
    flex: 0.6,
    textAlign: "right",
  },
  detailValueLink: {
    fontSize: 13,
    color: "#0ea360",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  narrationBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#0ea360",
  },
  narrationText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  copiedNotification: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    alignItems: "center",
  },
  copiedText: {
    color: "#0ea360",
    fontSize: 12,
    fontWeight: "600",
  },
});
