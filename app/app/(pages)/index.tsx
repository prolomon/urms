import { BusinessType, Payment, useAuth } from "@/hooks/use-auth";
import { RelativePathString, useRouter } from "expo-router";
import {
  Bell,
  CreditCard,
  History,
  ReceiptText,
  UserPen,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dashboard() {
  const router = useRouter();
  const { currentUser, payments, getBusiness } = useAuth();
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [pricing, setPricing] = useState<BusinessType[]>([]);

  const displayName = currentUser?.businessName ?? "AMAC Revenue";

  const billingFrequency = currentUser?.billingFrequency ?? "MONTHLY";
  const businessType = currentUser?.businessType ?? "MEDIUM";

  const frequencyMultipliers: Record<string, number> = {
    DAILY: 1,
    WEEKLY: 1,
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

  // Get base price from pricing data or fallback
  const basePrice = Number(
    pricing.find((type) => type.id === businessType)?.price ?? 15000,
  );

  const multiplier = frequencyMultipliers[billingFrequency] ?? 1;
  const nextPaymentAmount = basePrice * multiplier;

  const daysForFrequency = frequencyToDays[billingFrequency] ?? 30;

  const formatAmount = (value: number) =>
    value.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });

  const fetchPricing = useCallback(async () => {
    try {
      const response = await getBusiness();
      if (response && Array.isArray(response)) {
        setPricing(response);
      }
    } catch (error) {
      console.error("Failed to load pricing");
    }
  }, [getBusiness]);

  const loadRecentPayments = useCallback(async () => {
    try {
      const allPayments = await payments();

      if (!allPayments || allPayments.length === 0) {
        setRecentPayments([]);
        if (!currentUser?.due) {
          const createdDate = new Date(
            currentUser?.createdAt || Date.now(),
          ).getTime();
          const dueDateMs =
            createdDate + daysForFrequency * 24 * 60 * 60 * 1000;
          setDueDate(new Date(dueDateMs));
        }
        return;
      }

      const lastPayment = allPayments.reduce((latest, payment) => {
        const paymentDate = new Date(payment.due || payment.date);
        return paymentDate > new Date(latest.due || latest.date)
          ? payment
          : latest;
      }, allPayments[0]);

      if (!currentUser?.due) {
        const lastPaymentDate = new Date(
          lastPayment.due || lastPayment.date,
        ).getTime();
        const nextDueDateMs =
          lastPaymentDate + daysForFrequency * 24 * 60 * 60 * 1000;
        setDueDate(new Date(nextDueDateMs));
      }

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recent = allPayments.filter((payment) => {
        const paymentDate = new Date(payment.due || payment.date);
        return paymentDate >= twentyFourHoursAgo;
      });

      setRecentPayments(recent);
    } catch (error) {
      setRecentPayments([]);
    }
  }, [currentUser?.createdAt, currentUser?.due, daysForFrequency, payments]);

  useEffect(() => {
    // Prefer backend-provided due date when available
    if (currentUser?.due) {
      setDueDate(new Date(currentUser.due));
    }
  }, [currentUser?.due]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  useEffect(() => {
    loadRecentPayments();   
  }, [loadRecentPayments]);

  console.log(currentUser?.dueBalance, nextPaymentAmount);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.accountText}>{displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.8}
            onPress={() => router.push("notification" as RelativePathString)}
          >
            <Bell size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.nextPayment}>
          <Text style={styles.nextLabel}>Next Payment Due</Text>
          <Text style={styles.nextAmount}>
            {Number(currentUser?.dueBalance) === 0 ||
                currentUser?.dueBalance == null
                  ? formatAmount(nextPaymentAmount)
                  : formatAmount(currentUser?.dueBalance)} -{" "}
            {dueDate
              ? dueDate.toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.makePaymentButton}
        activeOpacity={0.8}
        onPress={() => router.push("payment" as RelativePathString)}
      >
        <CreditCard size={24} color="#fff" />
        <Text style={styles.makePaymentText}>Make Payment</Text>
      </TouchableOpacity>

      <View style={styles.tilesRow}>
        <TouchableOpacity
          style={[styles.tile, styles.tileBlue]}
          activeOpacity={0.8}
          onPress={() => router.push("history" as RelativePathString)}
        >
          <History size={36} color="#2563eb" style={styles.tileIcon} />
          <Text style={styles.tileText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tile, styles.tilePurple]}
          activeOpacity={0.8}
          onPress={() => router.push("profile" as RelativePathString)}
        >
          <UserPen size={36} color="#7c3aed" style={styles.tileIcon} />
          <Text style={styles.tileText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tilesRow}>
        <TouchableOpacity
          style={[styles.tile, styles.tileYellow]}
          activeOpacity={0.8}
          onPress={() => router.push("billing" as RelativePathString)}
        >
          <ReceiptText size={36} color="#fbbf24" style={styles.tileIcon} />
          <Text style={styles.tileText}>Billings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tile, styles.tileGreen]}
          activeOpacity={0.8}
          onPress={() => router.push("notification" as RelativePathString)}
        >
          <Bell size={36} color="#0ea360" style={styles.tileIcon} />
          <Text style={styles.tileText}>Alerts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentCard}>
        <Text style={styles.recentTitle}>Recent Transactions</Text>

        {recentPayments.length === 0 ? (
          <Text style={styles.emptyText}>No recent payments</Text>
        ) : (
          recentPayments.map((payment, index) => (
            <TouchableOpacity
              key={payment.reference}
              onPress={() =>
                router.push(
                  `/receipt/${payment.reference}` as RelativePathString,
                )
              }
              style={[styles.txRow, { marginTop: index > 0 ? 12 : 0 }]}
              activeOpacity={0.7}
            >
              <View>
                <Text>{payment.businessName || "Payment"}</Text>
                <Text style={styles.txDate}>
                  {new Date(payment.date).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.txAmount}>
                  {formatAmount(payment.amount)}
                </Text>
                <Text
                  style={[
                    styles.txStatus,
                    {
                      color:
                        payment.status === "SUCCESS"
                          ? "#14a76a"
                          : payment.status === "PENDING"
                            ? "#2563eb"
                            : "#e94b4b",
                    },
                  ]}
                >
                  {payment.status === "SUCCESS"
                    ? "Paid"
                    : payment.status === "PENDING"
                      ? "Pending"
                      : "Failed"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f3f5" },
  content: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: "#0ea360",
  },
  headerBackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
  },
  welcomeText: { fontSize: 24, color: "#fff" },
  accountText: { marginTop: 4, color: "rgba(255,255,255,0.9)", fontSize: 18 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 22, height: 22, tintColor: "#fff" },
  avatarInitial: { color: "#fff", fontWeight: "700", fontSize: 16 },

  nextPayment: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  nextLabel: { color: "rgba(255,255,255,0.9)", marginBottom: 6, fontSize: 20 },
  nextAmount: { fontSize: 16, color: "#fff", fontWeight: "600" },

  makePaymentButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#0ea360",
    marginHorizontal: 18,
    marginTop: 18,
  },
  makePaymentText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  tilesRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginTop: 18,
    justifyContent: "space-between",
  },
  tile: {
    width: "48%",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
  },
  tileIcon: { width: 36, height: 36, marginBottom: 8 },
  tileText: { textAlign: "center" },
  tileGreen: {
    backgroundColor: "#ecfff6",
    borderWidth: 1,
    borderColor: "#daf1e6",
  },
  tileBlue: {
    backgroundColor: "#eef6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  tilePurple: {
    backgroundColor: "#fbf4ff",
    borderWidth: 1,
    borderColor: "#efe7ff",
  },
  tileYellow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef0f2",
  },

  recentCard: {
    marginTop: 18,
    marginHorizontal: 18,
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
  },
  recentTitle: { marginBottom: 10, fontSize: 16, fontWeight: "bold" },
  emptyText: {
    color: "#97a0a2",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f0f3f5",
  },
  txDate: { color: "#97a0a2", fontSize: 13, marginTop: 4 },
  txAmount: { color: "#0ea360", fontWeight: "700", fontSize: 14 },
  txStatus: { fontSize: 12, marginTop: 4, fontWeight: "600" },
});
