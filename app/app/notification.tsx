import { useAuth } from '@/hooks/use-auth';
import { getRelativeTime } from '@/utils/date';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Notification = { id?: string; title: string; description: string; date: string; type: 'UPDATE' | 'SUCCESS' | 'FAILED' | 'PENDING' | 'REQUEST' | 'REMINDER' | 'WELCOME' };

const getColorByType = (type: string): string => {
  switch (type) {
    case 'WELCOME':
    case 'REQUEST':
      return '#6b7280';
    case 'SUCCESS':
      return '#16a34a';
    case 'REMINDER':
      return '#2f86d6';
    case 'UPDATE':
      return '#7c3aed';
    case 'PENDING':
      return '#fbbf24';
    case 'FAILED':
      return '#dc2626';
    default:
      return '#6b7280';
  }
};

export default function Notifications() {
  const router = useRouter();
  const { notifications: fetchNotifications } = useAuth();
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchNotifications();
        setNotes(data || []);
      } catch (e) {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchNotifications]);
  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} activeOpacity={0.7} onPress={() => router.back()}>
            <ArrowLeft color="#000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#000' }]}>Notifications</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <View style={styles.listWrap}>
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No Notifications</Text>
          </View>
        ) : (
          notes.map((n) => (
            <TouchableOpacity key={n.id || Math.random()} activeOpacity={0.9} style={styles.noteWrap}>
              <View style={[styles.leftBar, { backgroundColor: getColorByType(n.type) }]} />
              <View style={styles.noteCard}>
                <View style={styles.noteTop}>
                  <View style={[styles.iconCircle, { backgroundColor: `${getColorByType(n.type)}20` }]}>
                    <Bell size={18} color={getColorByType(n.type)} />
                  </View>
                  <Text style={styles.noteTitle}>{n.title}</Text>
                </View>
                <Text style={styles.noteBody}>{n.description}</Text>
                <Text style={styles.noteTime}>{getRelativeTime(n.date)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f9' },
  container: { paddingBottom: 40 },
  header: { paddingVertical: 14, paddingHorizontal: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 18 },

  listWrap: { paddingHorizontal: 12, paddingTop: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#9ca3af', fontSize: 16, marginTop: 12 },
  noteWrap: { flexDirection: 'row', marginBottom: 12, },
  leftBar: { width: 6, borderRadius: 4, marginRight: 8 },
  noteCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#eef2f3' },
  noteTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  icon: { width: 18, height: 18 },
  noteTitle: { fontSize: 16 },
  noteBody: { color: '#4b5659', marginTop: 4 },
  noteTime: { color: '#97a0a2', marginTop: 8, fontSize: 12 },
});
