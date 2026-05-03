import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const router = useRouter();
  const { currentUser, logout, forgot, changeCode } = useAuth();
  const { success, failed } = useToast();

  const name = (currentUser?.fullname || "Agent").trim();
  const entityId = currentUser?.uid || "-";
  const email = currentUser?.email || "-";
  const phone = currentUser?.phone || "-";
  const location = currentUser?.location || "-";
  const avatar = currentUser?.avatar || "-";
  const gender = currentUser?.gender || "-";
  const center = currentUser?.center || "-";
  const batchNo = currentUser?.batchNo || "-";
  const status =
    typeof currentUser?.status === "boolean"
      ? currentUser.status
        ? "Active"
        : "Inactive"
      : currentUser?.status || "-";
  const initial = name.charAt(0).toUpperCase();

  // Edit profile modal state
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  //Security Code
  const [securityVisible, setSecurityVisible] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [oldCode, setOldCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  // Change password modal state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const openSecurityModal = () => {
    setSecurityVisible(true);
    setNewCode("");
    setConfirmCode("");
    setOldCode("");
  }

  const openEdit = () => {
    setEditVisible(true);
  };

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordVisible(true);
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.uid) return failed("User not found");

    if (!newPassword.trim() || !confirmPassword.trim())
      return failed("Password required");

    if (newPassword.trim() !== confirmPassword.trim())
      return failed("Passwords do not match");

    const res = await forgot(
      currentUser.uid,
      newPassword.trim(),
      confirmPassword.trim(),
      oldPassword.trim()
    );

    if (!res.ok) return failed(res.message ?? "Could not change password");

    success(res.message ?? "Password updated");
    setPasswordVisible(false);

  };

  const handleChangeSecurityCode = async () => {
    if (!currentUser?.uid) return failed("User not found");

    console.log("Changing security code with values:", { oldCode, newCode, confirmCode });

    if (!newCode.trim() || !confirmCode.trim())
      return failed("Code required");

    if (newCode.trim() !== confirmCode.trim())
      return failed("Codes do not match");

    const res = await changeCode(
      oldCode.trim(),
      newCode.trim(),
      confirmCode.trim(),
    );

    if (!res.ok) return failed(res.message ?? "Could not change code");

    success(res.message ?? "Code updated");
    setSecurityVisible(false);

  };

  const handleAvatarChange = () => {

  }

  const handleResetSecurityCode = () => { }

  const handleResetPassword = () => { }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          style={styles.safe}
          contentContainerStyle={styles.container}
        >

          <View style={styles.avatar}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { borderWidth: 2, borderColor: avatar !== "-" ? "transparent" : "rgba(14,163,96,0.12)" }]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            </View>

            <View style={styles.identityWrap}>
              <Text style={styles.entityName}>{name}</Text>
              <Text style={styles.entityId}>{entityId}</Text>
            </View>
          </View>


          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Profile Details</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>UID</Text>
              <Text style={styles.infoValue}>{entityId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{gender}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Center</Text>
              <Text style={styles.infoValue}>{center}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Batch No</Text>
              <Text style={styles.infoValue}>{batchNo}</Text>
            </View>
          </View>

          <View style={[styles.infoCard, { gap: 10 }]}>
            <Text style={styles.infoLabel}>Actions</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={openEdit}
            >
              <Text style={styles.primaryText}>Upload Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={openPasswordModal}
            >
              <Text style={styles.secondaryText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={openSecurityModal}
            >
              <Text style={styles.secondaryText}>Change Security Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tertiaryBtn}
              activeOpacity={0.85}
              onPress={async () => {
                try {
                  await logout();
                  router.replace("login" as RelativePathString);
                  success("Logged out successfully");
                } catch (_: any) {
                  failed(_?.error || _?.message || "Logout failed");
                }
              }}
            >
              <Text style={styles.primaryText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Change Avatar Modal */}
          <Modal transparent visible={editVisible} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Change Profile</Text>
                <ScrollView>

                </ScrollView>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                    onPress={() => setEditVisible(false)}
                  >
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {
                        flex: 1,
                        marginLeft: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleAvatarChange}
                    disabled={saving}
                  >
                    {saving && (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text style={styles.primaryText}>
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Change Password Modal */}
          <Modal transparent visible={passwordVisible} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Change Password</Text>

                <Text style={styles.label}>Old password</Text>
                {/* Old Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Old password"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff color="#5b6b73" />
                    ) : (
                      <Eye color="#5b6b73" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>New password</Text>
                {/* New Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff color="#5b6b73" />
                    ) : (
                      <Eye color="#5b6b73" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm password</Text>
                {/* Confirm Password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff color="#5b6b73" />
                    ) : (
                      <Eye color="#5b6b73" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{}}
                  activeOpacity={0.85}
                  onPress={handleResetPassword}
                >
                  <Text style={[styles.secondaryText, { textAlign: "right", marginTop: 16 }]}>Reset Password</Text>
                </TouchableOpacity>

                {/* modal buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                    onPress={() => setPasswordVisible(false)}
                  >
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
                    activeOpacity={0.85}
                    onPress={handleForgotPassword}
                  >
                    <Text style={styles.primaryText}>Update</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </Modal>

          {/* Change security Modal */}
          <Modal transparent visible={securityVisible} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Change Security Code</Text>

                <Text style={styles.label}>Old code</Text>
                {/* Old Code */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={oldCode}
                    onChangeText={setOldCode}
                    placeholder="Old code"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showCode}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowCode((v) => !v)}
                    accessibilityLabel={
                      showCode ? "Hide code" : "Show code"
                    }
                  >
                    {showCode ? (
                      <EyeOff color="#5b6b73" />
                    ) : (
                      <Eye color="#5b6b73" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>New code</Text>
                {/* New Code */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={newCode}
                    onChangeText={setNewCode}
                    placeholder="New code"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showCode}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowCode((v) => !v)}
                    accessibilityLabel={
                      showCode ? "Hide code" : "Show code"
                    }
                  >
                    {showCode ? (
                      <EyeOff color="#5b6b73" />
                    ) : (
                      <Eye color="#5b6b73" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm code</Text>
                {/* Confirm Code */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={confirmCode}
                    onChangeText={setConfirmCode}
                    placeholder="Confirm code"
                    placeholderTextColor="#c7cbd0"
                    style={[styles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showCode}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowCode((v) => !v)}
                    accessibilityLabel={
                      showCode ? "Hide code" : "Show code"
                    }
                  >
                    {showCode ? (
                      <EyeOff color="#5b6b73" />
                    ) : (
                      <Eye color="#5b6b73" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={{}}
                  activeOpacity={0.85}
                  onPress={handleResetSecurityCode}
                >
                  <Text style={[styles.secondaryText, { textAlign: "right", marginTop: 16 }]}>Reset Code</Text>
                </TouchableOpacity>

                {/* modal buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.85}
                    onPress={() => setSecurityVisible(false)}
                  >
                    <Text style={styles.secondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
                    activeOpacity={0.85}
                    onPress={handleChangeSecurityCode}
                    disabled={confirmCode.length < 6 || newCode.length < 6 || oldCode.length < 6 || saving}
                  >
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
  safe: { flex: 1, backgroundColor: "ghostwhite" },
  container: { paddingBottom: 40 },
  avatarWrap: { alignItems: "center", marginTop: 18, },
  avatar: {
    borderRadius: 10,
    padding: 18,
    backgroundColor: "#fff",
    marginHorizontal: 14,
  },
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
  sectionTitle: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f3f5",
    paddingBottom: 8,
  },
  infoLabel: { fontSize: 12, color: "#7b8082", marginBottom: 4 },
  infoValue: { fontSize: 16, color: "#111827", fontWeight: "500" },
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
  },
  primaryText: { color: "#fff", fontSize: 16 },
  tertiaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5dadc",
    backgroundColor: "#f10000",
  },
  secondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5dadc",
    backgroundColor: "#fff",
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
