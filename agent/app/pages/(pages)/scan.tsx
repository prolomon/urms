import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/use-auth";

export default function ScanPage() {

    const { verifyPayment } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [flash, setFlash] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<null | { fullname: string; userId: string }>(null);
  const [successModal, setSuccessModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    handleRemove();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    try {
      // Parse the JSON from QR code
      const parsed = JSON.parse(data);
      // Extract the id field
      const id = parsed.id;
      if (id) {
        setScannedData(id);
        setModalVisible(true);
      } else {
        // Handle missing id field
        setScannedData(data);
        setModalVisible(true);
      }
    } catch (error) {
      // If parsing fails, use raw data
      setScannedData(data);
      setModalVisible(true);
    }
  };

  const handleRemove = () => {
    setScanned(false);
    setScannedData(null);
    setModalVisible(false);
    setVerifyResult(null);
    setVerifying(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setVerifyResult(null);
    setVerifying(false);
  };

  const handleVerify = async () => {
    if (!scannedData) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      // Replace with your actual API endpoint
      const result = await verifyPayment(scannedData);

      if (!result.ok) throw new Error("Verification failed");
      // result should be { reference, memberName, userId }
      setVerifyResult({
        fullname: (result.businessName || "").toUpperCase(),
        userId: (result.userId || "").toUpperCase(),
      });
      setSuccessModal(true);
      setModalVisible(false);
    } catch (e) {
      setVerifyResult(null);
      // Optionally show error feedback
    } finally {
      setVerifying(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.qrBoxWrap}>
          <View style={styles.qrBox}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              // facing={CameraType.back}
              enableTorch={flash}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  "qr",
                  // "ean13",
                  // "ean8",
                  // "upc_a",
                  // "upc_e",
                  // "code39",
                  // "code93",
                  // "code128",
                  // "pdf417",
                  // "aztec",
                  // "datamatrix",
                ],
              }}
            />
          </View>

          <TouchableOpacity
            style={styles.flashBtn}
            onPress={() => setFlash((f) => !f)}
          >
            <Ionicons
              name={flash ? "flash" : "flash-off"}
              size={28}
              color="#fff"
            />
            <Text style={styles.flashText}>
              {flash ? "Flash On" : "Flash Off"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scanned Data</Text>
            <Text style={styles.modalData}>{scannedData}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.aoBtn} onPress={handleRemove}>
                <Text style={styles.aoBtnText}>Re Scan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.aoBtn, { marginTop: 18, backgroundColor: '#0ea360' }]}
              onPress={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.aoBtnText}>Verify Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Success Modal */}
      <Modal
        visible={successModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: '#0ea360' }]}>Verification Successful</Text>
            {verifyResult && (
              <>
                <Text style={styles.modalLabel}>MEMBER NAME</Text>
                <Text style={styles.modalValue}>{verifyResult.fullname}</Text>
                <Text style={styles.modalLabel}>USER ID</Text>
                <Text style={styles.modalValue}>{verifyResult.userId}</Text>
              </>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => { setSuccessModal(false); handleRemove(); }}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101010" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { flexGrow: 1 },

  qrBoxWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  qrBox: {
    width: 260,
    height: 260,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#222",
  },

  modalLabel: { fontSize: 13, color: '#888', marginTop: 10 },
      modalValue: { fontSize: 16, color: '#222', fontWeight: 'bold', letterSpacing: 1 },
      closeBtn: {
        marginTop: 18,
        backgroundColor: '#0ea360',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
      },
      closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  flashBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    backgroundColor: "#333",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  flashText: { color: "#fff", marginLeft: 10, fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  modalData: { fontSize: 16, color: "#222", marginBottom: 24 },
  modalActions: { flexDirection: "row", gap: 18 },

  aoBtn: {
    backgroundColor: "#e53935",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  aoBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  cancelBtn: {
    backgroundColor: "#aaa",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
