import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { RelativePathString, useRouter } from "expo-router";
import { Lock, ShieldCheck, Wallet } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { createCode, token, currentUser } = useAuth();
    const { wallet, validateWallet, refresh } = useWallet(); 
    const { success, failed } = useToast();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [walletValidated, setWalletValidated] = useState(false);
    const [bvn, setBvn] = useState("");
    const [verifyingOwnership, setVerifyingOwnership] = useState(false);
    const [securityCode, setSecurityCode] = useState("");
    const [confirmSecurityCode, setConfirmSecurityCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [idType, setIdType] = useState<"BVN" | "NIN">("BVN");

    const validationState = useMemo(() => {
        const hasWallet = wallet ? true : false;
        const hasAccountNumber = wallet?.accountNo ? true : false;
        const isActive = wallet?.status ? true : false;
        const isVerified = wallet?.verify ? true : false;

        return {
            hasWallet,
            hasAccountNumber,
            isActive,
            isVerified,
            isValid: hasWallet && hasAccountNumber && isActive && isVerified,
        };

    }, [wallet]);

    const handleValidateWallet = () => {

        if (!validationState.hasWallet) {
            failed("Wallet not found. Please wait for wallet setup and try again.");
            return;
        }

        if (!validationState.hasAccountNumber) {
            failed("Wallet account number is missing.");
            return;
        }

        if (!validationState.isActive) {
            failed("Wallet is not active yet.");
            return;
        }

        success("Wallet validation successful");
        setWalletValidated(true);
        if (validationState.isVerified) {
            setStep(3);
        } else {
            setStep(2);
        }
    };

    const handleVerifyWalletOwnership = async () => {

        if (!walletValidated) {
            failed("Complete step 1 first");
            return;
        }

        if (!bvn.trim()) {
            failed("Enter BVN");
            return;
        }

        if (bvn.trim().length < 11) {
            failed("BVN should be 11 digits");
            return;
        }

        setLoading(true);

        try {

            setVerifyingOwnership(true);
            const res = await validateWallet(
                bvn.trim(),
                currentUser?.paystackCustomerCode || "",
                idType,
                token,
                wallet?.id || "",
            );

            if (res?.ok === false || res?.status === false) {
                failed(res?.message || "Wallet ownership verification failed");
                return;
            }

            refresh();

            success(res?.message || "Wallet ownership verified");
            setStep(3);
        } catch (error: any) {
            failed(error?.message || "Wallet ownership verification failed");
        } finally {
            setVerifyingOwnership(false);
            setLoading(false);
        }
    };

    const handleCreateCode = async () => {

        if (!securityCode || !confirmSecurityCode) {
            failed("Enter and confirm security code");
            return;
        }

        if (securityCode.length < 4) {
            failed("Security code must be at least 4 digits");
            return;
        }

        if (securityCode !== confirmSecurityCode) {
            failed("Security code and confirmation do not match");
            return;
        }

        try {
            setLoading(true);
            const res = await createCode(securityCode, confirmSecurityCode);
            if (!res.ok) {
                failed(res.message || res?.error || "Failed to set security code");
                return;
            }

            success(res.message || "Security code set successfully");
            router.replace("/pages/(pages)" as RelativePathString);
        }
        catch (e: any) {
            console.log(e)
            failed(e?.message || e?.error || "An error occurred while setting security code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.header}>
                    <Text style={styles.title}>Complete Profile</Text>
                    <Text style={styles.subtitle}>Finish these steps to activate your account.</Text>
                </View>

                <View style={styles.stepsRow}>
                    <View style={[styles.stepChip, step === 1 ? styles.stepChipActive : undefined]}>
                        <Text style={[styles.stepText, step === 1 ? styles.stepTextActive : undefined]}>Step 1</Text>
                    </View>
                    <View style={styles.stepDivider} />
                    <View style={[styles.stepChip, step === 2 ? styles.stepChipActive : undefined]}>
                        <Text style={[styles.stepText, step === 2 ? styles.stepTextActive : undefined]}>Step 2</Text>
                    </View>
                    <View style={styles.stepDivider} />
                    <View style={[styles.stepChip, step === 3 ? styles.stepChipActive : undefined]}>
                        <Text style={[styles.stepText, step === 3 ? styles.stepTextActive : undefined]}>Step 3</Text>
                    </View>
                </View>

                <View style={styles.card}>
                    {step === 1 ? (
                        <>
                            <View style={styles.cardHeadRow}>
                                <View style={styles.iconWrap}>
                                    <Wallet size={20} color="#0ea360" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>Validate Wallet</Text>
                                    <Text style={styles.cardSub}>Confirm wallet is active and verified.</Text>
                                </View>
                            </View>

                            <View style={styles.statusList}>
                                <StatusRow label="Wallet exists" ok={validationState.hasWallet} />
                                <StatusRow label="Account number available" ok={validationState.hasAccountNumber} />
                                <StatusRow label="Wallet active" ok={validationState.isActive} />
                                <StatusRow label="Wallet verified" ok={validationState.isVerified} />
                            </View>

                            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handleValidateWallet}>
                                <Text style={styles.buttonText}>Validate Wallet</Text>
                            </TouchableOpacity>
                        </>
                    ) : step === 2 ? (
                        <>
                            <View style={styles.cardHeadRow}>
                                <View style={styles.iconWrap}>
                                    <ShieldCheck size={20} color="#0ea360" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>Verify Wallet Ownership</Text>
                                    <Text style={styles.cardSub}>Enter BVN/NIN and verify with your wallet account details.</Text>
                                </View>
                            </View>

                            <Text style={styles.label}>Identification Type</Text>
                            <View style={styles.idTypeRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.idTypeOption,
                                        idType === "BVN" ? styles.idTypeOptionActive : undefined,
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => setIdType("BVN")}
                                >
                                    <View style={styles.idTypeRadioOuter}>
                                        {idType === "BVN" ? <View style={styles.idTypeRadioInner} /> : null}
                                    </View>
                                    <Text
                                        style={[
                                            styles.idTypeOptionText,
                                            idType === "BVN" ? styles.idTypeOptionTextActive : undefined,
                                        ]}
                                    >
                                        BVN
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.idTypeOption,
                                        idType === "NIN" ? styles.idTypeOptionActive : undefined,
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => setIdType("NIN")}
                                >
                                    <View style={styles.idTypeRadioOuter}>
                                        {idType === "NIN" ? <View style={styles.idTypeRadioInner} /> : null}
                                    </View>
                                    <Text
                                        style={[
                                            styles.idTypeOptionText,
                                            idType === "NIN" ? styles.idTypeOptionTextActive : undefined,
                                        ]}
                                    >
                                        NIN
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>{idType}</Text>
                            <View style={styles.inputWrap}>
                                <TextInput
                                    style={styles.input}
                                    value={bvn}
                                    onChangeText={setBvn}
                                    keyboardType="number-pad"
                                    placeholder={`Enter your ${idType}`}
                                    placeholderTextColor="#94a3b8"
                                    maxLength={11}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, verifyingOwnership ? styles.buttonDisabled : undefined]}
                                activeOpacity={0.85}
                                onPress={handleVerifyWalletOwnership}
                                disabled={verifyingOwnership}
                            >
                                {verifyingOwnership ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Verify Wallet</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => setStep(1)}>
                                <Text style={styles.secondaryText}>Back to Wallet Validation</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={styles.cardHeadRow}>
                                <View style={styles.iconWrap}>
                                    <ShieldCheck size={20} color="#0ea360" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>Set Security Code</Text>
                                    <Text style={styles.cardSub}>Create a code for transfer and sensitive actions.</Text>
                                </View>
                            </View>

                            <Text style={styles.label}>Security Code</Text>
                            <View style={styles.inputWrap}>
                                <Lock size={16} color="#64748b" style={{ marginLeft: 8 }} />
                                <TextInput
                                    style={styles.input}
                                    value={securityCode}
                                    onChangeText={setSecurityCode}
                                    keyboardType="number-pad"
                                    secureTextEntry
                                    placeholder="Enter code"
                                    placeholderTextColor="#94a3b8"
                                    maxLength={6}
                                />
                            </View>

                            <Text style={styles.label}>Confirm Security Code</Text>
                            <View style={styles.inputWrap}>
                                <Lock size={16} color="#64748b" style={{ marginLeft: 8 }} />
                                <TextInput
                                    style={styles.input}
                                    value={confirmSecurityCode}
                                    onChangeText={setConfirmSecurityCode}
                                    keyboardType="number-pad"
                                    secureTextEntry
                                    placeholder="Confirm code"
                                    placeholderTextColor="#94a3b8"
                                    maxLength={6}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading ? styles.buttonDisabled : undefined]}
                                activeOpacity={0.85}
                                onPress={handleCreateCode}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Save Security Code</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={() => validationState.isVerified ? setStep(1) : setStep(2)}>
                                <Text style={styles.secondaryText}>Back to Verification</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
    return (
        <View style={styles.statusRow}>
            <View style={[styles.statusDot, ok ? styles.statusDotOk : styles.statusDotBad]} />
            <Text style={styles.statusLabel}>{label}</Text>
            <Text style={[styles.statusValue, ok ? styles.statusValueOk : styles.statusValueBad]}>
                {ok ? "Ready" : "Pending"}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "ghostwhite" },
    content: { padding: 18, paddingBottom: 32 },
    header: { marginBottom: 16 },
    title: { fontSize: 28, fontWeight: "800", color: "#0f172a" },
    subtitle: { marginTop: 6, fontSize: 14, color: "#64748b" },
    stepsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    stepChip: {
        width: 80,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#e2e8f0",
        alignItems: "center",
        justifyContent: "center",
    },
    stepChipActive: {
        backgroundColor: "#0ea360",
    },
    stepText: { color: "#334155", fontWeight: "700", fontSize: 13 },
    stepTextActive: { color: "#fff" },
    stepDivider: {
        flex: 1,
        height: 2,
        backgroundColor: "#cbd5e1",
        marginHorizontal: 10,
    },
    card: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e6eaeb",
        borderRadius: 16,
        padding: 16,
    },
    cardHeadRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#e6f9f0",
        borderWidth: 1,
        borderColor: "#d4f5e6",
        alignItems: "center",
        justifyContent: "center",
    },
    cardTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
    cardSub: { marginTop: 2, fontSize: 13, color: "#64748b" },
    statusList: {
        borderWidth: 1,
        borderColor: "#eef2f7",
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: "#fafcfd",
        marginBottom: 14,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: "#eef2f7",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    statusDotOk: { backgroundColor: "#0ea360" },
    statusDotBad: { backgroundColor: "#ef4444" },
    statusLabel: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "600" },
    statusValue: { fontSize: 12, fontWeight: "700" },
    statusValueOk: { color: "#0ea360" },
    statusValueBad: { color: "#ef4444" },
    label: {
        marginTop: 10,
        marginBottom: 6,
        fontSize: 13,
        color: "#5b6b73",
        fontWeight: "600",
    },
    inputWrap: {
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e6e9eb",
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
    },
    readOnlyInputWrap: {
        backgroundColor: "#f8fafc",
    },
    idTypeRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 2,
    },
    idTypeOption: {
        flex: 1,
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e6e9eb",
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 12,
        gap: 8,
    },
    idTypeOptionActive: {
        borderColor: "#0ea360",
        backgroundColor: "#f2fbf7",
    },
    idTypeRadioOuter: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#cfd8d9",
        alignItems: "center",
        justifyContent: "center",
    },
    idTypeRadioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#0ea360",
    },
    idTypeOptionText: {
        color: "#334155",
        fontWeight: "700",
        fontSize: 14,
    },
    idTypeOptionTextActive: {
        color: "#0ea360",
    },
    input: {
        flex: 1,
        marginLeft: 8,
        color: "#111827",
        fontSize: 15,
    },
    button: {
        marginTop: 18,
        backgroundColor: "#0ea360",
        borderRadius: 10,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonDisabled: { opacity: 0.65 },
    buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    secondaryButton: {
        marginTop: 10,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#f8fafc",
    },
    secondaryText: { color: "#334155", fontWeight: "700", fontSize: 14 },
});
