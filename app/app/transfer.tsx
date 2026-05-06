import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { AUTH_MEMBER_TOKEN } from "@/lib/api";
import bankList from "@/lib/jsons/banklist.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BankOption = {
  id: string | number;
  name: string;
  code?: string;
  active?: boolean;
};

const BANK_OPTIONS: BankOption[] = (bankList as BankOption[])
  .filter((bank) => bank?.active !== false)
  .sort((a, b) => a.name.localeCompare(b.name));

export default function TransferScreen() {
  const { verifyCode } = useAuth()
  const router = useRouter();
  const { success, failed } = useToast();
  const {
    wallet,
    refresh,
    resolveBankAccount,
    initiateTransfer,
  } = useWallet();

  const [token, setToken] = useState<string | undefined>(undefined);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [resolving, setResolving] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [hide, setHide] = useState(false);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredBanks = BANK_OPTIONS.filter((bank) => {
    const query = bankSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      bank.name.toLowerCase().includes(query) ||
      String(bank.code || "").toLowerCase().includes(query) ||
      String(bank.id || "").toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    (async () => {
      const tok = await AsyncStorage.getItem(AUTH_MEMBER_TOKEN);
      if (tok) setToken(tok);
    })();
  }, []);

  const handleResolveAccount = async () => {
    if (accountNumber.trim().length < 10) {
      failed("Enter a valid account number");
      return;
    }

    if (!bankCode.trim()) {
      failed("Enter bank code");
      return;
    }

    try {
      setResolving(true);
      const data = await resolveBankAccount(
        accountNumber.trim(),
        bankCode.trim(),
        token,
      );

      const resolved =
        data?.data?.accountName || "";

      if (!resolved) {
        failed(data?.message || "Could not resolve account");
        return;
      }

      setRecipientName(String(resolved));
      setHide(true);
      success("Account resolved");
    } catch (e: any) {
      failed(e?.message || "Could not resolve account");
    } finally {
      setResolving(false);
    }
  };

  const handleTransfer = async () => {
    const value = Number(amount);
    if (!recipientName.trim()) {
      failed("Resolve account or enter recipient name");
      return;
    }
    if (!amount.trim() || Number.isNaN(value) || value <= 0) {
      failed("Enter a valid amount");
      return;
    }

    if (!code.trim() || code.trim().length < 4) {
      failed("Enter a valid security code");
      return;
    }

    const isValidCode = await verifyCode(code.trim());
    if (!isValidCode.ok) {
      failed("Invalid security code");
      return;
    }

    try {
      setSending(true);
      // Number(formData.amount), formData.accountNumber, formData.name, formData.bankCode, new Date().toISOString(), user?.name || "", formData.reason

      await initiateTransfer(
        amount,
        accountNumber.trim(),
        recipientName.trim(),
        bankCode.trim(),
        new Date().toISOString(),
        wallet?.accountNo || "",
        reason.trim() || "Wallet transfer",
        token,
      );

      success("Transfer initiated successfully");
      setAccountNumber("");
      setBankCode("");
      setRecipientName("");
      setAmount("");
      setReason("");
      refresh?.();
      router.push("index" as RelativePathString);
    } catch (e: any) {
      failed(e?.message || "Transfer failed");
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refresh();
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <ArrowLeft color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Transfer</Text>
            <View style={{ width: 34 }} />
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(Number(wallet?.balance || 0))}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              value={accountNumber}
              onChangeText={(e) => {
                setAccountNumber(e);
                if (e?.length >= 10) {
                  setHide(false);
                  setRecipientName("");
                  return;
                }
                setAccountNumber(e.replace(/[^0-9]/g, ""));
              }}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="0123456789"
              placeholderTextColor="#97a0a7"
              style={styles.input}
            />

            <Text style={styles.label}>Bank Code</Text>
            <TouchableOpacity
              style={styles.selectInput}
              activeOpacity={0.8}
              onPress={() => {
                setBankSearch("");
                setBankModalVisible(true);
              }}
            >
              <Text style={selectedBankName ? styles.selectText : styles.selectPlaceholder}>
                {selectedBankName || "Select bank"}
              </Text>
            </TouchableOpacity>

            {!hide && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleResolveAccount}
                disabled={resolving}
              >
                {resolving ? (
                  <ActivityIndicator color="#0ea360" />
                ) : (
                  <Text style={styles.secondaryText}>Resolve Account</Text>
                )}
              </TouchableOpacity>
            )}

            {hide && (<>
              <Text style={styles.label}>Recipient Name</Text>
              <TextInput
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Account holder name"
                placeholderTextColor="#97a0a7"
                style={styles.input}
                readOnly
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#97a0a7"
                style={styles.input}
              />

              <Text style={styles.label}>Reason</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Transfer purpose"
                placeholderTextColor="#97a0a7"
                style={styles.input}
              />

              <Text style={styles.label}>Security Code </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Security code"
                placeholderTextColor="#97a0a7"
                style={styles.input}
                maxLength={6}
              />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleTransfer}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Transfer Now</Text>
                )}
              </TouchableOpacity>
            </>)}
          </View>

          <Modal transparent visible={bankModalVisible} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Bank</Text>

                <View style={styles.searchWrap}>
                  <TextInput
                    value={bankSearch}
                    onChangeText={setBankSearch}
                    placeholder="Search bank"
                    placeholderTextColor="#97a0a7"
                    style={styles.searchInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Search size={18} color="#64748b" style={styles.searchIcon} />
                </View>

                <FlatList
                  data={filteredBanks}
                  keyExtractor={(item) => String(item.id)}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <Text style={styles.emptySearchText}>No banks found.</Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.bankItem}
                      activeOpacity={0.8}
                      onPress={() => {
                        setBankCode(String(item.code));
                        setSelectedBankName(item.name);
                        setHide(false);
                        setRecipientName("");
                        setBankModalVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bankName}>{item.name}</Text>
                        <Text style={styles.bankId}>
                          ID: {String(item.id)}{item.code ? ` | CODE: ${String(item.code)}` : ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={styles.closeButton}
                  activeOpacity={0.85}
                  onPress={() => setBankModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  container: { padding: 16, paddingBottom: 36 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  back: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  balanceCard: {
    backgroundColor: "#0ea360",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  balanceLabel: { color: "#dcfce7", fontSize: 13, marginBottom: 4 },
  balanceValue: { color: "#fff", fontSize: 28, fontWeight: "800" },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6f9f0",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  selectInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  selectText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  selectPlaceholder: {
    fontSize: 14,
    color: "#97a0a7",
  },
  selectCode: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  secondaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0ea360",
    backgroundColor: "#ecfdf5",
  },
  secondaryText: { color: "#0ea360", fontWeight: "700" },
  primaryBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0ea360",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  searchWrap: {
    position: "relative",
    marginBottom: 12,
  },
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderColor: "#dbe3ea",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingRight: 42,
    backgroundColor: "#fff",
    color: "#111827",
  },
  searchIcon: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  emptySearchText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 16,
  },
  bankItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  bankName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  bankId: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#0ea360",
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
