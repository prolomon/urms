import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { verifySecurityCode } from "@/lib/services/member";
import { getPayments, makePayment } from "@/lib/services/payment";
import { getPricingByCenter } from "@/lib/services/pricing";
import { Payment, Pricing } from "@/lib/types";
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
    const { currentUser, token } = useAuth();
    const { failed, success } = useToast();

    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [secureTokenInput, setSecureTokenInput] = useState<string>("");
    const [pricing, setPricing] = useState<Pricing[]>([]);

    const fetchPricing = useCallback(async () => {
        try {
            const data = await getPricingByCenter(currentUser?.center || "", token as string);
            if (data.ok && data.data) {
                setPricing(data.data);
            } else {
                setPricing([]);
                failed(data.message || "Failed to fetch pricing");
            }
        } catch (error: any) {
            setPricing([]);
            failed(error.message || "An error occurred while fetching pricing");
        }
    }, [token, failed]);

    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    const priceData = (id: string) => {
        return pricing.find((item) => item.id === id) as Pricing;
    }

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
            const data = await getPayments(currentUser.uid, token as string);

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
    }, [currentUser?.uid, token, failed]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPayments();
        setRefreshing(false);
    };

    const handlePayNow = async () => {
        if (!currentUser?.uid) {
            failed("No user available");
            return;
        }

        if (!secureTokenInput || secureTokenInput.trim().length === 0) {
            failed("Please enter your secure token");
            return;
        }

        try {
            const res = await verifySecurityCode(currentUser.uid, secureTokenInput.trim(), token as string);
            
            if (!res || !res.ok) {
                failed(res?.message || "Secure token verification failed");
                return;
            }

            success("Secure token verified");

            const paymentRes = await makePayment(
                currentUser.uid,
                Number(paymentAmount),
                selectedPayment?.payment as string,
                currentUser.center as string, 
                currentUser.company as string, 
                token as string
            );

            if (!paymentRes || !paymentRes.ok) {
                failed(paymentRes?.message || "Payment failed");
                return;
            }
            success("Payment successful");
            // Clear secure token after successful verification
            setSecureTokenInput("");
            setPaymentAmount("");
            setSelectedPayment(null);
            fetchPayments();
        } catch (error: any) {
            failed(error?.message || "An error occurred during verification");
        }
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
                        {sortedPayments.map((payment, index) => {

                            const pricingInfo = pricing.find((item) => item.id === payment.payment)

                            return (
                                <View
                                    key={payment.reference || `${payment.userId}-${index}`}
                                    style={styles.paymentCard}
                                >
                                    <View style={{ flex: 1 }}>
                                        {pricingInfo?.title ? (
                                            <Text style={[styles.paymentMeta, { fontSize: 16, fontWeight: "700", color: "#0f172a" }]}>
                                                Plan: {pricingInfo.title}
                                            </Text>
                                        ) : null}
                                        {pricingInfo?.category ? (
                                            <Text style={styles.paymentMeta}>
                                                Category: {pricingInfo.category}
                                            </Text>
                                        ) : null}
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <Text style={styles.paymentMeta}>
                                                Due: {formatDate(payment.due)}
                                            </Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
                                                <View style={[styles.statusBadge, { backgroundColor: "#f0fdf4" }]}>
                                                    <Text style={{ fontSize: 11, color: "#166534", fontWeight: "700" }}>
                                                        {payment.status}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: "4%", marginTop: 10, marginBottom: 6 }}>
                                            <View style={[styles.amountBadge, { width: "48%" }]}>
                                                <Text style={styles.amountLabel}>Amount</Text>
                                                <Text style={styles.amountValue}>
                                                    {formatAmount(Number(payment.amount) || 0).replace("₦", "")}
                                                </Text>
                                            </View>
                                            <View style={[styles.debtBadge, { width: "48%" }]}>
                                                <Text style={styles.debtLabel}>Debt</Text>
                                                <Text style={styles.debtValue}>
                                                    {formatAmount(Number(payment.debt) || 0).replace("₦", "")}
                                                </Text>
                                            </View>
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
                                </View>
                            );
                        })}
                    </View>
                )}

                <Modal visible={showPaymentModal} animationType="slide">
                    <View style={{ flex: 1, backgroundColor: "#fff" }}>
                        <View style={styles.modalHeaderRow}>
                            <View />
                            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <Text style={styles.modalTitleLarge}>
                                {pricing.find((item) => item.id === selectedPayment?.payment)?.title || selectedPayment?.payment || "Payment Details"}
                            </Text>

                            <View style={styles.badgeRow}>
                                {pricing.find((item) => item.id === selectedPayment?.payment)?.category ? (
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryText}>
                                            {pricing.find((item) => item.id === selectedPayment?.payment)?.category}
                                        </Text>
                                    </View>
                                ) : null}

                                <View style={[styles.statusBadge, { backgroundColor: "#eef2ff" }]}>
                                    <Text style={{ fontSize: 12, color: "#3730a3", fontWeight: "700" }}>
                                        {selectedPayment?.status}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reference</Text>
                                <Text style={styles.detailValue}>{selectedPayment?.reference || "N/A"}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Due</Text>
                                <Text style={styles.detailValue}>{formatDate(selectedPayment?.due)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Debt</Text>
                                <Text style={[styles.detailValue, { color: "#dc2626", fontWeight: "700" }]}>
                                    {selectedPayment ? formatAmount(Number(selectedPayment.debt) || 0) : "-"}
                                </Text>
                            </View>

                            <Text style={{ marginTop: 8, marginBottom: 6, color: "#64748b" }}>Enter amount to pay</Text>
                            <TextInput
                                style={[styles.amountInputLarge]}
                                placeholder="0"
                                keyboardType="numeric"
                                value={paymentAmount}
                                onChangeText={(text) => setPaymentAmount(text.replace(/[^0-9]/g, ""))}
                            />

                            <Text style={{ marginTop: 12, marginBottom: 6, color: "#64748b" }}>Secure token</Text>
                            <TextInput
                                style={[styles.amountInput, { marginBottom: 6 }]}
                                placeholder="Enter secure token"
                                secureTextEntry
                                value={secureTokenInput}
                                onChangeText={(text) => setSecureTokenInput(text)}
                            />
                            <View>
                                <Text>Transaction Fee is 5% of the payment amount</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.modalPayButton}
                                activeOpacity={0.95}
                                onPress={() => {
                                    handlePayNow();
                                    setShowPaymentModal(false);
                                }}
                            >
                                <Text style={styles.modalPayText}>Pay Now</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowPaymentModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
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
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    paymentTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 6 },
    paymentMeta: { marginTop: 3, fontSize: 16, color: "#64748b", lineHeight: 16 },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    amountBadge: {
        backgroundColor: "#dcfce7",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        minWidth: 70,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#0ea360",
    },
    amountLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
    amountValue: { fontSize: 16, color: "#0ea360", fontWeight: "700", marginTop: 2 },
    debtBadge: {
        backgroundColor: "#fee2e2",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        minWidth: 70,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#dc2626",
    },
    debtLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
    debtValue: { fontSize: 16, color: "#dc2626", fontWeight: "700", marginTop: 2 },
    payNowButton: {
        width: 310,
        backgroundColor: "#0ea360",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    payNowText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    modalHeader: {
        padding: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalHeaderRow: { padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    closeButton: { fontSize: 16, color: "#0ea360" },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#0f172a" },
    modalTitleLarge: { fontSize: 20, fontWeight: "800", marginBottom: 6, color: "#0f172a" },
    modalMeta: { marginBottom: 6, color: "#334155" },
    modalContent: { padding: 20, paddingTop: 12, alignItems: "stretch" },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    categoryBadge: { backgroundColor: "#f1f5f9", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    categoryText: { color: "#0f172a", fontWeight: "700" },
    detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
    detailLabel: { color: "#64748b", fontSize: 13 },
    detailValue: { color: "#0f172a", fontSize: 14, fontWeight: "600" },
    amountInput: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#1e293b",
    },
    amountInputLarge: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 16, fontSize: 18, color: "#0f172a", width: "100%" },
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
    modalPayButton: { backgroundColor: "#0ea360", paddingVertical: 14, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 16 },
    modalPayText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    modalCancelButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 10 },
    modalCancelText: { color: "#374151", fontSize: 15, fontWeight: "600" },
});