import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LinearGradient } from "expo-linear-gradient";
import { RelativePathString, useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const router = useRouter();
  const { currentUser, logout, forgotPassword } = useAuth();
  const { success, failed } = useToast();
  const name = currentUser?.fullname ?? "Johnson's Electronics";
  const entityId = currentUser?.uid ?? "AMC-12345678";
  const email = currentUser?.email ?? "you@domain.com";
  const phone = currentUser?.phone ?? "";
  const locationObj = currentUser?.location;
  const location = locationObj
    ? typeof locationObj === "string"
      ? locationObj
      : [locationObj.address, locationObj.city, locationObj.state, locationObj.zipcode]
          .filter(Boolean)
          .join(", ")
    : "";
  const businessType = currentUser?.type;
  const businessName = currentUser?.businessName ?? "AMAC Revenue";
  const initial = name ? name.charAt(0).toUpperCase() : "J";

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordVisible(true);
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.uid) return failed("User not found");
    const res = await forgotPassword(
      currentUser.uid,
      newPassword.trim(),
      confirmPassword.trim(),
    );
    if (!res.ok) return failed(res.message ?? "Could not send password reset");
    success(res.message ?? "Password reset email sent");
    setPasswordVisible(false);
  };

  const details: { label: string; value: string }[] = [
    { label: "Full name", value: currentUser?.fullname || "-" },
    { label: "User ID", value: currentUser?.uid || "-" },
    { label: "Email", value: currentUser?.email || "-" },
    { label: "Phone", value: currentUser?.phone || "-" },
    { label: "Business Name", value: currentUser?.businessName || "-" },
    { label: "Type", value: currentUser?.type || "-" },
    { label: "Category", value: currentUser?.category || "-" },
    { label: "Center", value: currentUser?.center || "-" },
    { label: "Agent", value: currentUser?.agent || "-" },
    { label: "Status", value: currentUser?.status ? "Active" : "Inactive" },
    { label: "Created", value: currentUser?.createdAt ? String(currentUser.createdAt) : "-" },
    { label: "Updated", value: currentUser?.updatedAt ? String(currentUser.updatedAt) : "-" },
    { label: "Location", value: location || "-" },
  ];

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Profile</Text>
            <Text style={styles.welcomeSubtitle}>{name}</Text>
          </View>

          <View style={styles.card}>
            {details.map((d) => (
              <View key={d.label} style={styles.detailRowFull}>
                <Text style={styles.detailLabelFull}>{d.label}</Text>
                <Text style={styles.detailValueFull}>{d.value}</Text>
              </View>
            ))}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={openPasswordModal}>
                <Text style={styles.secondaryText}>Change Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { marginLeft: 12 }]}
                activeOpacity={0.85}
                onPress={async () => {
                  try {
                    await logout();
                    router.replace("login" as RelativePathString);
                    success("Logged out successfully");
                  } catch (_error: any) {
                    failed("Logout failed");
                  }
                }}
              >
                <Text style={styles.primaryText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* forgotten password modal */}
          <Modal transparent visible={passwordVisible} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.label}>New password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowNewPassword((v) => !v)}
                    accessibilityLabel={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff color="#5b6b73" /> : <Eye color="#5b6b73" />}
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff color="#5b6b73" /> : <Eye color="#5b6b73" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 8 }}>
                  <Text style={{ color: "#0ea360", fontSize: 14 }}>Forgot your password?</Text>
                </TouchableOpacity>

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={() => setPasswordVisible(false)}>
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]} activeOpacity={0.85} onPress={handleForgotPassword}>
                    <Text style={styles.primaryText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { paddingBottom: 40, paddingHorizontal: 10, paddingVertical: 40, paddingTop: 60 },
  bgGradient: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  header: { alignItems: "flex-start", paddingHorizontal: 16, marginBottom: 24 },
  logoBox: {
    width: 124,
    height: 124,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#0ea360",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  welcomeSection: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0ea360",
    textAlign: "left",
    marginBottom: 20,
    lineHeight: 38,
    textTransform: "capitalize",
  },
  welcomeDescription: {
    fontSize: 18,
    color: "#334155",
    textAlign: "left",
    lineHeight: 26,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eaeb",
    borderRadius: 16,
    padding: 16,
  },
  detailRowFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  detailLabelFull: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13,
  },
  detailValueFull: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  actionsRow: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 18 },
  headerTitle: { color: "#fff", fontSize: 18 },

  avatarWrap: { alignItems: "center", marginTop: 18 },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(14,163,96,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { width: 36, height: 36, tintColor: "#0ea360" },
  avatarInitial: { color: "#0ea360", fontSize: 36, fontWeight: "700" },

  identityWrap: { alignItems: "center", marginTop: 12 },
  entityName: { fontSize: 20, marginBottom: 6 },
  entityId: { color: "#6b7175" },

  infoCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
  },
  infoLabel: { fontSize: 12, color: "#7b8082", marginBottom: 6 },
  infoValue: { fontSize: 16 },
  price: { color: "#0ea360", fontSize: 15 },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeToggle: {
    position: "absolute",
    right: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  primaryBtn: {
    backgroundColor: "#0ea360",
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  primaryText: { color: "#fff", fontSize: 16 },
  secondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5dadc",
    backgroundColor: "#fff",
    width: "100%",
  },
  secondaryText: { color: "#0ea360" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  modalButtons: { flexDirection: "row", marginTop: 14, alignItems: "center" },

  label: { marginTop: 8, marginBottom: 6, color: "#5b6b73" },
  typeWrap: { marginBottom: 6 },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  typeItemSelected: { borderColor: "#0ea360", backgroundColor: "#f2fbf7" },
  typeRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#cfd8d9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  typeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0ea360",
  },
  typeLabel: { fontSize: 15 },
  typePrice: { color: "#0ea360", marginTop: 2 },
});
