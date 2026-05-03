import { BusinessType, useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BillingSettings() {
  const router = useRouter();
  const { currentUser, billing, getBusiness, payments } = useAuth();
  const { success, failed } = useToast();
  const [frequency, setFrequency] = useState<
    "MONTHLY" | "QUARTERLY" | "YEARLY"
  >(
    currentUser?.billingFrequency?.toUpperCase() as
      | "MONTHLY"
      | "QUARTERLY"
      | "YEARLY",
  );
  const [autoDebit, setAutoDebit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pricing, setPricing] = useState<BusinessType[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [lastPaymentDue, setLastPaymentDue] = useState<Date | null>(null);

  useEffect(() => {
    const run = async () => {
      await Promise.all([fetchPricing(), fetchPaymentHistory()]);
    };
    run();
  }, []);

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

  const fetchPaymentHistory = async () => {
    try {
      setLoadingPayments(true);
      const list = (await payments?.()) || [];
      if (Array.isArray(list) && list.length > 0) {
        const latest = list.reduce((latest, payment) => {
          const dueDate = new Date(payment.due || payment.date);
          return dueDate > new Date(latest.due || latest.date)
            ? payment
            : latest;
        }, list[0]);
        setLastPaymentDue(new Date(latest.due || latest.date));
      } else {
        setLastPaymentDue(null);
      }
    } catch (error) {
      setLastPaymentDue(null);
    } finally {
      setLoadingPayments(false);
    }
  };

  const currentPlanPrice =
    pricing.find((t) => t.id === currentUser?.businessType)?.price || "15000";

  const frequencyList = [
    {
      key: "monthly" as const,
      label: "Monthly",
      multiplier: 1,
    },
    {
      key: "quarterly" as const,
      label: "Quarterly",
      multiplier: 3,
    },
    {
      key: "yearly" as const,
      label: "Yearly",
      multiplier: 12,
    },
  ];

  const calculatePrice = (multiplier: number) => {
    const price = Number(currentPlanPrice) || 15000;
    return (price * multiplier).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    });
  };

  const today = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  })();

  const frequencyDays: Record<string, number> = {
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
  };

  const computedDueDate = (() => {
    const days = frequencyDays[frequency ?? "MONTHLY"] ?? 30;
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  })();

  const formattedDueDate = computedDueDate.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isSaveDisabled = today < computedDueDate;

  const handleBilling = () => {
    if (frequency) {
      billing(
        frequency.toUpperCase() as "MONTHLY" | "QUARTERLY" | "YEARLY",
        new Date(computedDueDate),
      );
      success("Billing settings updated successfully!");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPricing();
    setRefreshing(false);
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
          <Text style={[styles.headerTitle, { color: "#000" }]}>
            Billing Settings
          </Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Plan</Text>

        <View style={styles.currentPlan}>
          {loadingPricing ? (
            <ActivityIndicator size="small" color="#0ea360" />
          ) : pricing.find((t) => t.id === currentUser?.businessType) ? (
            <>
              <Text style={styles.planName}>
                {pricing.find((t) => t.id === currentUser?.businessType)?.title}
              </Text>
              <Text style={styles.planPrice}>
                ₦
                {Number(
                  pricing.find((t) => t.id === currentUser?.businessType)
                    ?.price,
                ).toLocaleString("en-NG")}
                /month
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.planName}>No Plan Selected</Text>
              <Text style={styles.planPrice}>₦0/month</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Billing Frequency</Text>

        {frequencyList.map((freq) => (
          <TouchableOpacity
            key={freq.key}
            style={styles.option}
            activeOpacity={0.8}
            onPress={() =>
              setFrequency(
                freq.key.toUpperCase() as "MONTHLY" | "QUARTERLY" | "YEARLY",
              )
            }
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.radioOuter,
                  frequency?.toUpperCase() === freq.key?.toUpperCase()
                    ? styles.radioSelected
                    : undefined,
                ]}
              >
                {frequency?.toUpperCase() === freq.key?.toUpperCase() ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
              <Text>{freq.label}</Text>
            </View>
            <Text style={styles.optionPrice}>
              {calculatePrice(freq.multiplier)}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.dueDateRow}>
          <Text style={styles.dueDateLabel}>Next due date</Text>
          <Text style={styles.dueDateValue}>{formattedDueDate}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Payment</Text>
        <View style={styles.autoRow}>
          <View style={styles.autoLeft}>
            <Text>Enable Auto-Debit</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggle,
              autoDebit ? styles.toggleOn : styles.toggleOff,
            ]}
            onPress={() => setAutoDebit((s) => !s)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.toggleCircle,
                autoDebit ? styles.toggleCircleOn : styles.toggleCircleOff,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          Note: After you change billing frequency or plan and make a payment,
          further changes can only be made 31 days after the due date.
        </Text>
      </View>

      <View style={styles.saveWrap}>
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!isSaveDisabled || loadingPricing || loadingPayments) &&
              styles.saveBtnDisabled,
          ]}
          activeOpacity={0.9}
          onPress={handleBilling}
          disabled={!isSaveDisabled || loadingPricing || loadingPayments}
        >
          <Text style={[styles.saveText, { color: "#fff" }]}>
            🔒 Save Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f9" },
  container: { paddingBottom: 40 },
  header: { paddingTop: 20, paddingHorizontal: 14 },
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
  headerTitle: { color: "#fff", fontSize: 18 },

  section: { marginTop: 14, paddingHorizontal: 14 },
  sectionTitle: { marginBottom: 10 },

  currentPlan: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#ecfff6",
    borderWidth: 1,
    borderColor: "#daf1e6",
  },
  planName: { fontSize: 16, marginBottom: 6, textTransform: "capitalize" },
  planPrice: { color: "#0ea360" },

  option: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eef2f3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLeft: { flexDirection: "row", alignItems: "center" },
  optionPrice: { color: "#0ea360" },

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

  autoRow: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  autoLeft: { flex: 1 },

  toggle: {
    width: 54,
    height: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOff: { backgroundColor: "#eef0f2" },
  toggleOn: { backgroundColor: "#d7f3e8" },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  toggleCircleOn: { transform: [{ translateX: 12 }] },
  toggleCircleOff: { transform: [{ translateX: -12 }] },

  noteCard: {
    marginTop: 12,
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff8e1",
    borderWidth: 1,
    borderColor: "#ffecb5",
  },
  noteText: {
    color: "#8a6d1f",
    fontSize: 13,
    lineHeight: 18,
  },

  dueDateRow: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dueDateLabel: {
    color: "#1f2937",
    fontWeight: "600",
  },
  dueDateValue: {
    color: "#0ea360",
    fontWeight: "700",
  },

  saveWrap: { paddingHorizontal: 14, marginTop: 18 },
  saveBtn: {
    backgroundColor: "#0ea360",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: { color: "#fff" },
});
