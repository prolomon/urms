import { Payment, useAuth } from '@/hooks/use-auth';
import { RelativePathString, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function History() {
  const { payments } = useAuth();
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
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
      </View>

      <View style={styles.listWrap}>
        {paymentList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You don&apos;t have any payment history</Text>
          </View>
        ) : (
          paymentList.map((tx) => {
            const title = tx.businessName || 'Payment';
            const subtitle = tx.frequency;
            const date = tx.date;
            const rawStatus = tx.status;
            const status = rawStatus === 'SUCCESS' ? 'Paid' : rawStatus === 'PENDING' ? 'Pending' : rawStatus === 'FAILED' ? 'Failed' : rawStatus;
            const amount = `₦${tx.amount.toLocaleString()}`;
            const color = status === 'Paid' ? '#14a76a' : status === 'Pending' ? '#2266ff' : '#e94b4b';

            return (
              <TouchableOpacity
                onPress={() => router.push(`/receipt/${tx.reference}` as RelativePathString)}
                key={tx.reference}
                style={[styles.txCard, { borderLeftColor: color }]}
              >
                <View style={styles.txContent}>
                  <View style={styles.txTextLeft}>
                    <Text style={styles.txTitle}>{title}</Text>
                    <Text style={styles.txSubtitle}>{subtitle}</Text>
                    <Text style={styles.txDate}>{new Date(date).toLocaleString()}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color }]}>{amount}</Text>
                    <View style={[styles.statusBadge, status === 'Paid' ? styles.badgePaid : status === 'Pending' ? styles.badgeCompleted : styles.badgePending]}>
                      <Text style={styles.statusText}>{status}</Text>
                    </View>
                  </View>
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

  listWrap: { marginTop: 16, paddingHorizontal: 10 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#97a0a2', textAlign: 'center' },
  txCard: { backgroundColor: '#f9fffb', borderRadius: 8, marginBottom: 12, padding: 12, borderLeftWidth: 6 },
  txContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTextLeft: { flex: 1, paddingRight: 8 },
  txTitle: { fontSize: 16 },
  txSubtitle: { color: '#6f777a', marginTop: 6 },
  txDate: { color: '#97a0a2', marginTop: 6 },

  txRight: { alignItems: 'flex-end', minWidth: 90 },
  txAmount: { fontSize: 15, fontWeight: '700' },

  statusBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgePaid: { backgroundColor: '#e6fbf0' },
  badgeCompleted: { backgroundColor: '#eaf0ff' },
  badgePending: { backgroundColor: '#fdecec' },
  statusText: { fontSize: 12 },
});
