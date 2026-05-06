import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LinearGradient } from "expo-linear-gradient";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentsScreen() {
  const { payments, verifyCode } = useAuth();
  const { success, failed } = useToast();
  const router = useRouter();

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payments();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [payments]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openPay = (item: any) => {
    setSelected(item);
    setAmount(String(item.amount || ""));
    setCode("");
    setModalVisible(true);
  };

  async function handlePayNow() {
    if (!code || code.trim().length < 4) return failed("Enter security code");

    setProcessing(true);
    try {
      const res = await verifyCode(code.trim());
      if (!res.ok) {
        failed(res.message || "Invalid security code");
        return;
      }

      // call placeholder checkout handler
      await handleCheckout();
      success("Checkout handled (placeholder)");
      setModalVisible(false);
    } catch (e: any) {
      failed(e?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  // intentionally empty — implement checkout logic here
  async function handleCheckout() {}

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["rgba(14,163,96,0.18)", "rgba(14,163,96,0.0)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
              <ArrowLeft color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Payments</Text>
            <View style={{ width: 34 }} />
          </View>

          <View style={styles.listWrap}>
            {loading ? (
              <ActivityIndicator color="#0ea360" />
            ) : list.length === 0 ? (
              <Text style={styles.emptyText}>No available payments</Text>
            ) : (
              list.map((p) => (
                <View key={p.reference || p.id} style={styles.payCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payTitle}>{p.businessName || p.payment || "Payment"}</Text>
                    <Text style={styles.paySub}>{p.frequency || p.payment}</Text>
                    <Text style={styles.payDate}>{p.date ? new Date(p.date).toLocaleDateString() : "-"}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.payAmount}>₦{Number(p.amount || 0).toLocaleString()}</Text>
                    <TouchableOpacity style={styles.payBtn} onPress={() => openPay(p)}>
                      <Text style={styles.payBtnText}>Pay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <Modal transparent visible={modalVisible} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Pay Payment</Text>
                {selected ? (
                  <View>
                    <Text style={styles.label}>Reference</Text>
                    <Text style={styles.inputReadOnly}>{selected.reference || selected.id}</Text>

                    <Text style={styles.label}>Business</Text>
                    <Text style={styles.inputReadOnly}>{selected.businessName}</Text>

                    <Text style={styles.label}>Amount</Text>
                    <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" style={styles.input} />

                    <Text style={styles.label}>Security Code</Text>
                    <TextInput value={code} onChangeText={setCode} secureTextEntry style={styles.input} />

                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalVisible(false)}>
                        <Text style={styles.secondaryText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]} onPress={handlePayNow} disabled={processing}>
                        {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Pay Now</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, paddingBottom: 36 },
  bgGradient: { position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  back: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  listWrap: { marginTop: 6 },
  emptyText: { textAlign: 'center', color: '#64748b', paddingVertical: 16 },
  payCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6f9f0', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  payTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  paySub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  payDate: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  payAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  payBtn: { backgroundColor: '#0ea360', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  payBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { marginTop: 8, marginBottom: 6, color: '#5b6b73' },
  input: { height: 44, borderWidth: 1, borderColor: '#e6e9eb', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  inputReadOnly: { height: 44, borderWidth: 1, borderColor: '#e6e9eb', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#f8fafc', textAlignVertical: 'center', paddingTop: 12 },
  primaryBtn: { marginTop: 0, backgroundColor: '#0ea360', height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16 },
  secondaryBtn: { height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d5dadc', backgroundColor: '#fff', paddingHorizontal: 12 },
  secondaryText: { color: '#0ea360' },
});
