import { User, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/use-auth";


export default function Profile() {

  const { members } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const fetchMembers = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    const res = await members();
    setData(res || []);
    if (!options?.silent) {
      setLoading(false);
    }
  }, [members]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers({ silent: true });
    setRefreshing(false);
  };

  const filtered = search.trim()
    ? data.filter(
      (m) =>
        m.fullname?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.uid?.toLowerCase().includes(search.toLowerCase())
    )
    : data;

  const selectedMember = data.find((m) => m.uid === selectedId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ backgroundColor: "ghostwhite" }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.headerCard}>
          <Text style={styles.pageTitle}>Members</Text>
          <Text style={styles.pageSubtitle}>Manage {data.length} registered member{data.length !== 1 ? "s" : ""}</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#0ea360" />
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.uid}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => setSelectedId(item.uid)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberItemContent}>
                    <View style={styles.memberAvatarWrap}>
                      <User size={20} color="#0ea360" />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>
                        {item.fullname || item.email || item.uid}
                      </Text>
                      {item.businessName && (
                        <Text style={styles.memberBusiness}>{item.businessName}</Text>
                      )}
                      <Text style={styles.memberEmail}>{item.email}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No members found</Text>
                  <Text style={styles.emptyStateSubtext}>Add your first member to get started</Text>
                </View>
              }
            />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedId}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedId("")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Details</Text>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={() => setSelectedId("")}
                activeOpacity={0.7}
              >
                <X size={24} color="#0ea360" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedMember ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name</Text>
                    <Text style={styles.detailValue}>{selectedMember.fullname}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedMember.email}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>UID</Text>
                    <Text style={styles.detailValue}>{selectedMember.uid}</Text>
                  </View>

                  {selectedMember.phone && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{selectedMember.phone}</Text>
                    </View>
                  )}

                  {selectedMember.businessName && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Business Name</Text>
                      <Text style={styles.detailValue}>{selectedMember.businessName}</Text>
                    </View>
                  )}

                  {selectedMember.type && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Account Type</Text>
                      <Text style={styles.detailValue}>{selectedMember.type}</Text>
                    </View>
                  )}

                  {selectedMember.category && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{selectedMember.category}</Text>
                    </View>
                  )}

                  {selectedMember.center && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Center</Text>
                      <Text style={styles.detailValue}>{selectedMember.center}</Text>
                    </View>
                  )}

                  {selectedMember.location && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>
                        {typeof selectedMember.location === 'string'
                          ? selectedMember.location
                          : JSON.stringify(selectedMember.location)}
                      </Text>
                    </View>
                  )}

                  {selectedMember.createdAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Joined</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedMember.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.emptyStateText}>No details found.</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedId("")}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  content: { paddingBottom: 24 },
  
  headerCard: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },

  searchContainer: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6eaeb",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1a202c",
    fontWeight: "500",
  },

  listContainer: {
    paddingHorizontal: 18,
  },
  memberItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6eaeb",
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e6f9f0",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  memberBusiness: {
    fontSize: 13,
    color: "#0ea360",
    fontWeight: "600",
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 3,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#94a3b8",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6f9f0",
  },
  modalScroll: {
    maxHeight: "70%",
    marginBottom: 16,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  closeBtn: {
    backgroundColor: "#0ea360",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
