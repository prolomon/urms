import { formatCurrency } from "@/config";
import { useAuth } from "@/hooks/use-auth";
import { useWallet } from "@/hooks/use-wallet";
import { Transaction } from "@/lib/types";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft, ReceiptText } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// date filter type removed (not used) to avoid unused type warnings

export default function HistoryScreen() {
	const router = useRouter();
	const { currentUser } = useAuth();
	const { wallet, getTransactions, refresh } = useWallet();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [items, setItems] = useState<Transaction[]>([]);
	const [fromDate, setFromDate] = useState(
		new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
	);
	const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

	const loadPayments = useCallback(async (from?: string, to?: string) => {
		try {
			const userId = currentUser?.id || currentUser?.uid;
			if (!userId || !wallet) {
				setItems([]);
				return;
			}

			const start = from || fromDate;
			const end = to || toDate;

			const data = await getTransactions(
				wallet?.accountNo || "",
				start,
				end,
				wallet?.token || "",
			);
			const sorted = [...(data?.transactions || [])].sort(
				(a, b) =>
					new Date(b.timeCreated || b.timeUpdated || 0).getTime() -
					new Date(a.timeCreated || a.timeUpdated || 0).getTime(),
			);
			setItems(sorted);
		} catch {
			setItems([]);
		}
	}, [currentUser?.id, currentUser?.uid, wallet, fromDate, toDate, getTransactions]);

	useEffect(() => {
		(async () => {
			setLoading(true);
			await loadPayments();
			setLoading(false);
		})();
	}, [loadPayments]);

	const onRefresh = async () => {
		setRefreshing(true);
		await refresh?.();
		await loadPayments();
		setRefreshing(false);
	};

	const getStatusColor = (status?: string) => {
		if (status === "SUCCESS") return "#0ea360";
		if (status === "PENDING") return "#f59e0b";
		if (status === "FAILED") return "#ef4444";
		if (status === "CANCELLED") return "#6b7280";
		return "#475569";
	};

	const filteredItems = useMemo(() => items, [items]);

	return (
		<SafeAreaView style={styles.safe}>
			<View style={styles.headerRow}>
				<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
					<ArrowLeft size={22} color="#111827" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Transaction History</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{loading ? (
					<View style={styles.stateWrap}>
						<ActivityIndicator color="#0ea360" size="large" />
						<Text style={styles.stateText}>Loading transactions...</Text>
					</View>
				) : items.length === 0 ? (
					<View style={styles.emptyWrap}>
						<View style={styles.emptyIconWrap}>
							<ReceiptText size={28} color="#0ea360" />
						</View>
						<Text style={styles.emptyTitle}>No transactions yet</Text>
						<Text style={styles.emptyText}>
							Your payment history will appear here once you start collecting
							payments.
						</Text>
						<TouchableOpacity
							style={styles.primaryBtn}
							onPress={() => router.push("/(pages)/scan" as RelativePathString)}
						>
							<Text style={styles.primaryBtnText}>Scan Payment</Text>
						</TouchableOpacity>
					</View>
				) : (
					<>
						<View style={{ marginBottom: 12 }}>
							<Text style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>Filter by date (YYYY-MM-DD)</Text>
							<View style={{ flexDirection: "row", alignItems: "center" }}>
								<TextInput
									placeholder="From"
									value={fromDate}
									onChangeText={setFromDate}
									style={styles.dateInput}
								/>
								<TextInput
									placeholder="To"
									value={toDate}
									onChangeText={setToDate}
									style={[styles.dateInput, { marginLeft: 8 }]}
								/>
								<TouchableOpacity
									style={[styles.primaryBtn, { marginLeft: 8, paddingHorizontal: 12 }]}
									onPress={() => loadPayments(fromDate, toDate)}
								>
									<Text style={styles.primaryBtnText}>Apply</Text>
								</TouchableOpacity>
							</View>
						</View>
						<View style={styles.listWrap}>
							{filteredItems.length === 0 ? (
								<Text style={styles.stateText}>No transactions for selected date filter.</Text>
							) : (
								filteredItems.slice(0, 6).map((tx) => (
									<TouchableOpacity
										key={tx.id}
										style={styles.itemRow}
										activeOpacity={0.8}
										onPress={() =>
											router.push(`/pages/transaction/${tx.id}` as RelativePathString)
										}
									>
										<View style={{ flex: 1, paddingRight: 10 }}>
											<Text style={styles.itemTitle}>{tx.narration || tx.transactionCategory || "Transaction"}</Text>
											<Text style={styles.itemSub}>{tx.paymentVendorReference || tx.billingVendorReference || tx.recipientAccountName || ""}</Text>
											<Text style={styles.itemDate}>
												{(tx.timeCreated || tx.timeUpdated) ? new Date(tx.timeCreated || tx.timeUpdated).toLocaleString() : "-"}
											</Text>
										</View>
										<View style={{ alignItems: "flex-end" }}>
											<Text style={styles.itemAmount}>
												{formatCurrency(Number(tx.amount || 0))}
											</Text>
											<View
												style={[
													styles.statusChip,
													{ backgroundColor: `${getStatusColor(String(tx.status))}1A` },
												]}
											>
												<Text
													style={[
														styles.statusText,
														{ color: getStatusColor(String(tx.status)) },
													]}
												>
													{String(tx.status)}
												</Text>
											</View>
										</View>
									</TouchableOpacity>
								))
							)}
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "ghostwhite" },
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#e5e7eb",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#111827",
	},
	content: {
		paddingHorizontal: 14,
		paddingBottom: 24,
	},
	filterWrap: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginBottom: 12,
	},
	dateInput: {
		flex: 1,
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#e5e7eb",
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
	},
	filterChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: "#ffffff",
		borderWidth: 1,
		borderColor: "#d1d5db",
	},
	filterChipActive: {
		backgroundColor: "#0ea360",
		borderColor: "#0ea360",
	},
	filterChipText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#334155",
	},
	filterChipTextActive: {
		color: "#ffffff",
	},
	listWrap: {
		backgroundColor: "#fff",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#e6f9f0",
		overflow: "hidden",
	},
	itemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#f1f5f9",
	},
	itemTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#0f172a",
	},
	itemSub: {
		fontSize: 12,
		color: "#64748b",
		marginTop: 2,
	},
	itemDate: {
		fontSize: 11,
		color: "#94a3b8",
		marginTop: 3,
	},
	itemAmount: {
		fontSize: 14,
		fontWeight: "700",
		color: "#0f172a",
	},
	statusChip: {
		marginTop: 6,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	statusText: {
		fontSize: 11,
		fontWeight: "700",
	},
	stateWrap: {
		paddingVertical: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	stateText: {
		marginTop: 10,
		color: "#64748b",
		fontSize: 13,
	},
	emptyWrap: {
		backgroundColor: "#fff",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#e6f9f0",
		padding: 20,
		alignItems: "center",
	},
	emptyIconWrap: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#e6f9f0",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#0f172a",
		marginBottom: 6,
	},
	emptyText: {
		fontSize: 13,
		textAlign: "center",
		color: "#64748b",
		lineHeight: 19,
	},
	primaryBtn: {
		marginTop: 14,
		backgroundColor: "#0ea360",
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	primaryBtnText: {
		color: "#fff",
		fontWeight: "700",
	},
});
