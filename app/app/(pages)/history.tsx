import { Payment, useAuth } from '@/hooks/use-auth';
import { RelativePathString, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function History() {
  const { payments } = useAuth();
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const router = useRouter();

  const loadPayments = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await payments();
      setPaymentList(Array.isArray(data) ? data : []);
    } catch (error) {
      setPaymentList([]);
    } finally {
      setRefreshing(false);
    }
  }, [payments]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    if (!fromDate && !toDate) return paymentList;
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return paymentList.filter((p) => {
      const d = p.date ? new Date(p.date) : null;
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [paymentList, fromDate, toDate]);

  return (
    <ScrollView
      style={styles.safe}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadPayments} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} activeOpacity={0.7} onPress={() => router.back()}>
            <ArrowLeft color="#000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#000' }]}>Payment History</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput placeholder="Search payments..." placeholderTextColor="#bfc7ca" style={styles.searchInput} />
        <View style={styles.rangeRow}>
          <TextInput placeholder="From (YYYY-MM-DD)" placeholderTextColor="#bfc7ca" style={styles.rangeInput} value={fromDate} onChangeText={setFromDate} />
          <TextInput placeholder="To (YYYY-MM-DD)" placeholderTextColor="#bfc7ca" style={styles.rangeInput} value={toDate} onChangeText={setToDate} />
        </View>
      </View>

      <View style={styles.historyWrap}>
        {refreshing ? (
          <Text style={styles.historyStateText}>Refreshing transactions...</Text>
        ) : filteredPayments.length === 0 ? (
          <Text style={styles.historyStateText}>No transactions found.</Text>
        ) : (
          filteredPayments.slice(0, 12).map((tx) => {
            const title = tx.businessName || 'Payment';
            const subtitle = tx.frequency || tx.payment || '';
            const date = tx.date;
            const rawStatus = tx.status || '';
            const status = rawStatus === 'SUCCESS' ? 'Paid' : rawStatus === 'PENDING' ? 'Pending' : rawStatus === 'FAILED' ? 'Failed' : rawStatus;
            const amount = tx.amount ? `₦${Number(tx.amount).toLocaleString()}` : '-';
            const color = status === 'Paid' ? '#14a76a' : status === 'Pending' ? '#2266ff' : '#e94b4b';

            return (
              <TouchableOpacity
                key={tx.reference}
                style={styles.historyItem}
                activeOpacity={0.8}
                onPress={() => router.push(`/receipt/${tx.reference}` as RelativePathString)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{title}</Text>
                  <Text style={styles.historySub}>{subtitle}</Text>
                  <Text style={styles.historyDate}>{date ? new Date(date).toLocaleDateString() : '-'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.historyAmount}>{amount}</Text>
                  <Text style={[styles.historyStatus, { color }]}>{status}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f9' },
  container: { paddingBottom: 40 },
  header: { paddingVertical: 14, paddingHorizontal: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16  },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 18 },

  searchWrap: { paddingHorizontal: 14 },
  searchInput: { height: 44, borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 12, borderWidth: 1, borderColor: '#eceff0' },
  rangeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rangeInput: { flex: 1, height: 40, borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 10, borderWidth: 1, borderColor: '#eceff0' },

  historyWrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e6f9f0',
    padding: 12,
    marginTop: 16,
    paddingHorizontal: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  historySub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  historyDate: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  historyAmount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  historyStatus: { marginTop: 4, fontSize: 12, fontWeight: '700' },
  historyStateText: { fontSize: 13, color: '#64748b', textAlign: 'center', paddingVertical: 16 },
});
