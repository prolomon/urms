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
    const [error, setError] = useState<string>("");

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
            setError("No user available");
            failed("No user available");
            return;
        }

        if (!secureTokenInput || secureTokenInput.trim().length === 0) {
            setError("Please enter your secure token");
            failed("Please enter your secure token");
            return;
        }

        try {
            const res = await verifySecurityCode(currentUser.uid, secureTokenInput.trim(), token as string);

            if (!res || !res.ok) {
                setError(res?.message || "Secure token verification failed");
                failed(res?.message || "Secure token verification failed");
                return;
            }

            const paymentRes = await makePayment(
                currentUser.uid,
                Number(paymentAmount),
                selectedPayment?.payment as string,
                currentUser.center as string,
                currentUser.company as string,
                token as string
            );

            if (!paymentRes || !paymentRes.ok) {
                setError(paymentRes?.message || "Payment failed");
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
            setError(error?.message || "An error occurred during verification");
            failed(error?.message || "An error occurred during verification");
        } finally {
            setShowPaymentModal(false)
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
                            const isPayable = payment.status.toLowerCase() !== "success" && Number(payment.debt) > 0;
                            const statusLabel = payment.status.charAt(0).toUpperCase() + payment.status.slice(1).toLowerCase();

                            return (
                                <View
                                    key={payment.reference || `${payment.userId}-${index}`}
                                    style={styles.paymentCard}
                                >
                                    <View style={styles.cardTopRow}>
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text style={styles.planLabel} numberOfLines={1}>
                                                {pricingInfo?.title || "Payment"}
                                            </Text>
                                            {pricingInfo?.category ? (
                                                <Text style={styles.paymentMeta} numberOfLines={1}>
                                                    {pricingInfo.category}
                                                </Text>
                                            ) : null}
                                            <Text style={styles.paymentMeta}>
                                                Due {formatDate(payment.due)}
                                            </Text>
                                        </View>

                                        <View style={[styles.statusBadge, payment.status.toLowerCase() === "success" ? styles.statusSuccess : styles.statusPending]}>
                                            <Text style={[styles.statusText, payment.status.toLowerCase() === "success" ? styles.statusTextSuccess : styles.statusTextPending]}>
                                                {statusLabel}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.amountGrid}>
                                        <View style={styles.amountBadge}>
                                            <Text style={styles.amountLabel}>Amount</Text>
                                            <Text style={styles.amountValue}>
                                                {formatAmount(Number(payment.amount) || 0).replace("₦", "")}
                                            </Text>
                                        </View>
                                        <View style={styles.debtBadge}>
                                            <Text style={styles.debtLabel}>Outstanding</Text>
                                            <Text style={styles.debtValue}>
                                                {formatAmount(Number(payment.debt) || 0).replace("₦", "")}
                                            </Text>
                                        </View>
                                    </View>

                                    {isPayable ? (
                                        <TouchableOpacity
                                            style={styles.payNowButton}
                                            activeOpacity={0.85}
                                            onPress={() => {
                                                setSelectedPayment(payment);
                                                setPaymentAmount(String(payment.amount || ""));
                                                setShowPaymentModal(true);
                                            }}
                                        >
                                            <Text style={styles.payNowText}>Pay now</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                )}

                <Modal visible={showPaymentModal} animationType="slide">
                    <View style={styles.modalShell}>
                        <View style={styles.modalHeaderRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalEyebrow}>Payment checkout</Text>
                                <Text style={styles.modalHeaderTitle}>Review and pay securely</Text>
                            </View>
                            <TouchableOpacity style={styles.closeButtonWrap} onPress={() => setShowPaymentModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {error ? (
                            <View style={styles.errorBanner}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeroCard}>
                                <Text style={styles.modalTitleLarge} numberOfLines={1}>
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

                                    <View style={[styles.statusBadge, selectedPayment?.status?.toLowerCase() === "success" ? styles.statusSuccess : styles.statusPending]}>
                                        <Text style={[styles.statusText, selectedPayment?.status?.toLowerCase() === "success" ? styles.statusTextSuccess : styles.statusTextPending]}>
                                            {selectedPayment?.status || "Pending"}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.modalSubtitle}>
                                    Confirm the details below, enter the amount, and complete the payment in one step.
                                </Text>
                            </View>

                            <View style={styles.summaryGrid}>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryLabel}>Reference</Text>
                                    <Text style={styles.summaryValue} numberOfLines={1}>
                                        {selectedPayment?.reference || "N/A"}
                                    </Text>
                                </View>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryLabel}>Due date</Text>
                                    <Text style={styles.summaryValue} numberOfLines={1}>
                                        {formatDate(selectedPayment?.due)}
                                    </Text>
                                </View>
                                <View style={[styles.summaryCard, styles.summaryCardWide]}>
                                    <Text style={styles.summaryLabel}>Outstanding balance</Text>
                                    <Text style={[styles.summaryValue, { color: "#dc2626" }]}>
                                        {selectedPayment ? formatAmount(Number(selectedPayment.debt) || 0) : "-"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Enter amount to pay</Text>
                                <TextInput
                                    style={styles.amountInputLarge}
                                    placeholder="0"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="numeric"
                                    value={paymentAmount}
                                    onChangeText={(text) => setPaymentAmount(text.replace(/[^0-9]/g, ""))}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Secure token</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="Enter secure token"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                    value={secureTokenInput}
                                    onChangeText={(text) => setSecureTokenInput(text)}
                                />
                            </View>

                            <View style={styles.feeNote}>
                                <Text style={styles.feeNoteText}>Transaction fee is 2.5% of the payment amount.</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.modalPayButton}
                                activeOpacity={0.95}
                                onPress={() => {
                                    handlePayNow();
                                }}
                            >
                                <Text style={styles.modalPayText}>Pay now</Text>
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
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        flexDirection: "column",
        gap: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
    },
    cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    planLabel: { fontSize: 16, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
    paymentMeta: { marginTop: 4, fontSize: 13, color: "#64748b", lineHeight: 18 },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 999,
        alignSelf: "flex-start",
        borderWidth: 1,
    },
    statusSuccess: {
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
    },
    statusPending: {
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
    },
    statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
    statusTextSuccess: { color: "#166534" },
    statusTextPending: { color: "#1d4ed8" },
    amountGrid: {
        flexDirection: "row",
        gap: 10,
    },
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
        backgroundColor: "#fee2e2",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 70,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#dc2626",
    },
    debtLabel: { fontSize: 12, color: "#0f172a", fontWeight: "600" },
    debtValue: { fontSize: 16, color: "#dc2626", fontWeight: "700", marginTop: 2 },
    payNowButton: {
        width: "100%",
        backgroundColor: "#0f766e",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    payNowText: { color: "#fff", fontWeight: "800", fontSize: 14 },
    modalHeader: {
        padding: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    modalShell: { flex: 1, backgroundColor: "#f8fafc" },
    modalHeaderRow: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        backgroundColor: "#fff",
    },
    modalEyebrow: { color: "#0f766e", fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
    modalHeaderTitle: { marginTop: 4, color: "#0f172a", fontSize: 18, fontWeight: "800" },
    closeButtonWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" },
    closeButton: { fontSize: 16, color: "#0f172a", fontWeight: "700" },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#0f172a" },
    modalTitleLarge: { fontSize: 20, fontWeight: "800", marginBottom: 6, color: "#0f172a" },
    modalSubtitle: { marginTop: 4, color: "#64748b", fontSize: 13, lineHeight: 19 },
    modalMeta: { marginBottom: 6, color: "#334155" },
    modalContent: { padding: 16, paddingTop: 14, paddingBottom: 28, alignItems: "stretch" },
    modalHeroCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    categoryBadge: { backgroundColor: "#f1f5f9", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    categoryText: { color: "#0f172a", fontWeight: "700" },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
    summaryCard: { flexBasis: "48%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" },
    summaryCardWide: { flexBasis: "100%" },
    summaryLabel: { color: "#64748b", fontSize: 12, fontWeight: "600", marginBottom: 6 },
    summaryValue: { color: "#0f172a", fontSize: 14, fontWeight: "700" },
    inputGroup: { marginBottom: 12 },
    inputLabel: { marginBottom: 6, color: "#334155", fontSize: 13, fontWeight: "600" },
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
    amountInputLarge: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 16, fontSize: 18, color: "#0f172a", width: "100%" },
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
    errorBanner: { backgroundColor: "#fee2e2", paddingHorizontal: 12, paddingVertical: 14, marginVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#fecaca" },
    errorText: { color: "#b91c1c", fontSize: 14, lineHeight: 20 },
    feeNote: { marginTop: 2, padding: 12, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" },
    feeNoteText: { color: "#475569", fontSize: 13, lineHeight: 19 },
});