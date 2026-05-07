import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { printAsync } from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Download, Share2 } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";

export default function Receipt() {
  const { receipt } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { success, failed } = useToast();
  const viewShotRef = useRef<ViewShot | null>(null);
  const detailsViewRef = useRef<ViewShot | null>(null);

  const loadReceipt = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await receipt(id);
      setReceiptData(data);
    } catch (error) {
      failed("Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }, [failed, id, receipt]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const handleDownload = async () => {
    try {
      // Capture both views
      if (!viewShotRef.current?.capture || !detailsViewRef.current?.capture) {
        failed("Failed to capture receipt");
        return;
      }

      const uri = await viewShotRef.current.capture();
      const detailsUri = await detailsViewRef.current.capture();

      if (!uri || !detailsUri) {
        failed("Failed to capture receipt");
        return;
      }

      // Convert first image to base64
      const base64 = await fetch(uri)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve(reader.result?.toString().split(",")[1] || "");
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            }),
        );

      // Convert second image to base64
      const base64Details = await fetch(detailsUri)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve(reader.result?.toString().split(",")[1] || "");
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            }),
        );

      // Create HTML content for printing with two pages using captured images
      const html = `
        <html>
          <head>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; }
              .page { page-break-after: always; padding: 20px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
              .receipt-image { width: 100%; max-width: 600px; margin: 0 auto; }
              .receipt-image img { width: 100%; height: auto; }
              .details-image { width: 100%; max-width: 600px; margin: 0 auto; }
              .details-image img { width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <!-- Page 1: Receipt Card -->
            <div class="page">
              <div class="receipt-image">
                <img src="data:image/png;base64,${base64}" />
              </div>
            </div>

            <!-- Page 2: Payment Details -->
            <div class="page">
              <div class="details-image">
                <img src="data:image/png;base64,${base64Details}" />
              </div>
            </div>
          </body>
        </html>
      `;

      // Print the receipt
      await printAsync({
        html: html,
      });

      success("Receipt printed successfully!");
    } catch (error) {
      console.log("Print error:", error);
      failed("Failed to print receipt");
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `
 Amac REVENUE - Digital Receipt
Receipt No: ${receiptData?.reference || "N/A"}
Date: ${receiptData?.date || "N/A"}
Business: ${receiptData?.businessName || "N/A"}
Amount: ₦${receiptData?.amount?.toLocaleString() || "0"}
Status: ${receiptData?.status || "N/A"}
      `.trim();

      await Share.share({
        message: shareMessage,
        title: "Payment Receipt",
      });
    } catch (error) {
      failed("Failed to share receipt");
    }
  };

  if (loading) {
    return (
      <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.back}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#000" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: "#000" }]}>
              Digital Receipt
            </Text>
            <View style={{ width: 32 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!receiptData) {
    return (
      <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.back}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#000" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: "#000" }]}>
              Digital Receipt
            </Text>
            <View style={{ width: 32 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Receipt not found</Text>
        </View>
      </ScrollView>
    );
  }

  const statusColor =
    receiptData?.status === "SUCCESS"
      ? "#14a76a"
      : receiptData?.status === "PENDING"
        ? "#2266ff"
        : "#e94b4b";

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.back}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: "#000" }]}>
            Digital Receipt
          </Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Image 
                source={require("@/assets/images/icon.png")} 
                style={styles.logo} 
              />
            </View>
            <Text style={styles.brand}>Amac REVENUE</Text>
            <Text style={styles.subtitle}>Official Receipt</Text>

            <View style={styles.row}>
              <View style={styles.colLeft}>
                <Text style={styles.label}>Receipt No:</Text>
                <Text style={styles.value}>
                  {receiptData?.reference || "N/A"}
                </Text>
              </View>
              <View style={styles.colRight}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{receiptData?.date || "N/A"}</Text>
              </View>
            </View>

            <View style={[styles.row, { marginTop: 6 }]}>
              <Text style={styles.label}>User ID:</Text>
              <Text style={styles.value}>{receiptData?.userId || "N/A"}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Business Name:</Text>
            <Text style={styles.valueBlock}>
              {receiptData?.businessName || "N/A"}
            </Text>

            <View style={styles.divider} />

            <View style={styles.rowSpace}>
              <View>
                <Text style={styles.label}>
                  {receiptData?.frequency || "Monthly"}
                </Text>
                <Text style={styles.value}>Amount:</Text>
              </View>
              <Text style={styles.amount}>
                ₦{receiptData?.amount?.toLocaleString() || "0"}
              </Text>
            </View>

            <View style={styles.rowSpace}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: statusColor }]}>
                {receiptData?.status === "SUCCESS"
                  ? "Paid"
                  : receiptData?.status === "PENDING"
                    ? "Pending"
                    : receiptData?.status || "Unknown"}
              </Text>
            </View>

            <View style={styles.qrWrap}>
              <QRCode
                value={JSON.stringify({
                  id: receiptData?.reference
                })}
                size={200}
              />
              <Text style={styles.qrLabel}>Scan QR for verification</Text>
            </View>
          </View>
        </View>
      </ViewShot>

      <ViewShot ref={detailsViewRef} options={{ format: "png", quality: 0.9 }}>
        <View style={styles.detailsWrap}>
          <Text style={styles.detailsTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Receipt Number</Text>
            <Text style={styles.detailValue}>
              {receiptData?.reference || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              ₦{receiptData?.amount?.toLocaleString() || "0"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due</Text>
            <Text style={styles.detailValue}>
              {new Date(receiptData?.due)?.toDateString() || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: statusColor }]}>
              {receiptData?.status === "SUCCESS"
                ? "Paid"
                : receiptData?.status === "PENDING"
                  ? "Pending"
                  : receiptData?.status || "Unknown"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>
              {receiptData?.payment || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{receiptData?.date || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>
              {receiptData?.frequency || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Business Name</Text>
            <Text style={styles.detailValue}>
              {receiptData?.businessName || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Business Type</Text>
            <Text style={styles.detailValue}>
              {receiptData?.businessType || "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User ID</Text>
            <Text style={styles.detailValue}>
              {receiptData?.userId || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Check</Text>
            <View style={{
              backgroundColor: '#14a76a',
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 4,
              alignSelf: 'flex-start',
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                {receiptData?.isVerify ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>

          <View style={styles.warningNote}>
            <Text style={styles.warningText}>
              ⚠️ Any alteration done on this document will render it invalid
            </Text>
          </View>
        </View>
      </ViewShot>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.download]}
          activeOpacity={0.85}
          onPress={handleDownload}
        >
          <Download color="#fff" size={20} />
          <Text style={[styles.actionText, { color: "#fff", marginLeft: 8 }]}>
            Download
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.share]}
          activeOpacity={0.85}
          onPress={handleShare}
        >
          <Share2 color="#fff" size={20} />
          <Text style={[styles.actionText, { color: "#fff", marginLeft: 8 }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f9" },
  container: { paddingBottom: 40, paddingTop: 8 },
  header: { paddingVertical: 14, paddingHorizontal: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18 },
  headerTitle: { color: "#fff", fontSize: 18 },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: { fontSize: 16, color: "#97a0a2", textAlign: "center" },

  cardWrap: { paddingHorizontal: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6eaeb",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  brand: { textAlign: "center", color: "#0b7b55", marginBottom: 2 },
  subtitle: { textAlign: "center", color: "#6b777b", marginBottom: 12 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  colLeft: { flex: 1 },
  colRight: { alignItems: "flex-end" },
  label: { color: "#6b777b" },
  value: { fontSize: 14, fontWeight: "700" },
  valueBlock: { fontSize: 16, fontWeight: "700", marginTop: 6 },

  divider: { height: 1, backgroundColor: "#eef2f3", marginVertical: 12 },

  amount: { fontSize: 16, fontWeight: "700", color: "#0b7b55" },

  qrWrap: { alignItems: "center", marginTop: 14 },
  qr: { width: 92, height: 92, backgroundColor: "#f0f0f0" },
  qrLabel: { marginTop: 8, color: "#97a0a2" },

  detailsWrap: {
    paddingHorizontal: 14,
    marginTop: 24,
    backgroundColor: "#fff",
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6eaeb",
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f3",
  },
  detailLabel: { color: "#6b777b", fontSize: 14 },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a202c",
    textAlign: "right",
    flex: 1,
    marginLeft: 8,
  },

  actions: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginTop: 18,
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  download: { backgroundColor: "#2563eb", marginRight: 10 },
  share: { backgroundColor: "#0ea360" },
  actionText: { color: "#fff" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: 20,
    textAlign: "center",
  },
  formatButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  formatButtonSecondary: {
    backgroundColor: "#0ea360",
  },
  formatButtonCancel: {
    backgroundColor: "#f5f5f5",
  },
  formatButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  formatButtonSecondaryText: {
    color: "#fff",
  },
  formatButtonCancelText: {
    color: "#6b777b",
  },
  warningNote: {
    backgroundColor: "#fbbf24",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  warningText: {
    color: "#78350f",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
