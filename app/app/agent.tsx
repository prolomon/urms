import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getAgent } from "@/lib/services/agent";
import { Agent } from "@/lib/types";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AgentScreen() {
	const { currentUser, token } = useAuth();
	const { success, failed } = useToast();
	const router = useRouter();

	const [agent, setAgent] = useState<Agent | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (currentUser?.agent) {
			fetchAgent(currentUser.agent);
		}
	}, [currentUser?.agent]);

	const fetchAgent = async (id: string) => {
		try {
			setLoading(true);
			const data = await getAgent(id, token as string);
			const a = data?.data || data?.agent || data;
			setAgent(a || null);
		} catch (e: any) {
			failed(e?.message || "Failed to load agent");
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		if (!currentUser?.agent) return;
		await fetchAgent(currentUser.agent);
	};

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}>
				<View style={styles.headerRow}>
					<TouchableOpacity style={styles.back} onPress={() => router.back()}>
						<ArrowLeft color="#111827" />
					</TouchableOpacity>
					<Text style={styles.title}>Agent Details</Text>
					<View style={{ width: 34 }} />
				</View>

				<View style={styles.card}>
					{loading ? (
						<ActivityIndicator size="small" color="#0ea360" />
					) : agent ? (
						<>
							<View style={styles.topRow}>
								{agent.avatar ? (
									<Image source={{ uri: agent.avatar }} style={styles.avatar} />
								) : (
									<View style={styles.avatarPlaceholder}>
										<Text style={styles.avatarInitials}>{(agent.fullname || agent.name || "?").split(" ").map(s => s[0]).slice(0,2).join("")}</Text>
									</View>
								)}

								<View style={{ flex: 1, marginLeft: 12 }}>
									<Text style={styles.agentName}>{agent.fullname || agent.name}</Text>
									<Text style={styles.agentSub}>{agent.company || agent.center || ""}</Text>
								</View>
							</View>

							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>Email</Text>
								<Text style={styles.detailValue}>{agent.email || "-"}</Text>
							</View>

							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>Phone</Text>
								<Text style={styles.detailValue}>{agent.phone || "-"}</Text>
							</View>

							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>Center</Text>
								<Text style={styles.detailValue}>{agent.center || "-"}</Text>
							</View>

							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>Zone</Text>
								<Text style={styles.detailValue}>{agent.zone || "-"}</Text>
							</View>

							<View style={styles.detailRow}>
								<Text style={styles.detailLabel}>Status</Text>
								<Text style={[styles.detailValue, agent.status ? styles.statusOk : styles.statusBad]}>{agent.status ? "Active" : "Inactive"}</Text>
							</View>

							<View style={styles.detailRowLast}>
								<Text style={styles.detailLabel}>Joined</Text>
								<Text style={styles.detailValue}>{agent.createdAt ? new Date(agent.createdAt as any).toLocaleString() : "-"}</Text>
							</View>
						</>
					) : (
						<Text style={styles.emptyText}>No agent information available.</Text>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "ghostwhite" },
	content: { padding: 18, paddingBottom: 32 },
	headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 14 },
	back: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
	title: { fontSize: 20, fontWeight: "700", color: "#111827" },
	card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e6eaeb", borderRadius: 16, padding: 16 },
	topRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
	avatar: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#f8fafc" },
	avatarPlaceholder: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#eef9f0", alignItems: "center", justifyContent: "center" },
	avatarInitials: { color: "#0ea360", fontWeight: "800", fontSize: 22 },
	agentName: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
	agentSub: { marginTop: 4, color: "#64748b" },
	detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eef2f7" },
	detailRowLast: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
	detailLabel: { color: "#334155", fontWeight: "700" },
	detailValue: { color: "#64748b", fontWeight: "700" },
	statusOk: { color: "#0ea360" },
	statusBad: { color: "#ef4444" },
	emptyText: { textAlign: "center", color: "#64748b", paddingVertical: 20 },
});
