import { BusinessType, useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RelativePathString, useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useEffect, useState } from "react";
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
  const { currentUser, updateProfile, logout, forgotPassword, getBusiness } =
    useAuth();
  const { success, failed } = useToast();
  const name = currentUser?.fullname ?? "Johnson's Electronics";
  const entityId = currentUser?.uid ?? "AMC-12345678";
  const email = currentUser?.email ?? "you@domain.com";
  const phone = currentUser?.phone ?? "";
  const location = currentUser?.location ?? "";
  const businessType = currentUser?.businessType;
  const businessName = currentUser?.businessName ?? "AMAC Revenue";
  const initial = name ? name.charAt(0).toUpperCase() : "J";

  const [editVisible, setEditVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pricing, setPricing] = useState<BusinessType[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [editLocation, setEditLocation] = useState(location ?? "");
  const [editBusinessType, setEditBusinessType] = useState<string>(
    currentUser?.businessType ?? "",
  );
  const [editBusinessName, setEditBusinessName] = useState(businessName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const businessTypeLabel = (type?: string) => {
    const found = pricing.find((p) => p.id === type);
    if (found)
      return `${found.title} (${Number(found.price).toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
      })})`;
    return type || "Unknown";
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true);
      const response = await getBusiness();
      if (response && Array.isArray(response)) {
        setPricing(response);
      }
    } catch (error) {
      failed("Failed to load pricing");
    } finally {
      setLoadingPricing(false);
    }
  };

  const openEdit = () => {
    setEditName(name);
    setEditEmail(email);
    setEditPhone(phone);
    setEditLocation(location ?? "");
    setEditBusinessType(currentUser?.businessType ?? "MEDIUM");
    setEditVisible(true);
  };

  const openPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setPasswordVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return failed("Name is required");
    const updates = {
      fullname: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      location: editLocation.trim(),
      businessType: editBusinessType,
      businessName:
        currentUser?.type === "INDIVIDUAL"
          ? editName.trim()
          : editBusinessName.trim(),
    };
    const res = await updateProfile(updates, currentUser?.uid);
    if (!res.ok) return failed(res.message ?? "Could not update profile");
    success("Profile updated successfully");
    setEditVisible(false);
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
                Entity Profile
              </Text>
              <View style={{ width: 32 }} />
            </View>
          </View>

          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          </View>

          <View style={styles.identityWrap}>
            <Text style={styles.entityName}>{name}</Text>
            <Text style={styles.entityId}>{entityId}</Text>
          </View>

          {(currentUser?.type ?? "") !== "INDIVIDUAL" && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Business Name</Text>
              <Text style={styles.infoValue}>{businessName}</Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>
              {businessTypeLabel(businessType)}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{location}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{phone}</Text>
          </View>

          <View style={[styles.infoCard, { gap: 10 }]}>
            <Text style={styles.infoLabel}>Actions</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={openEdit}
            >
              <Text style={styles.primaryText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.85}
              onPress={openPasswordModal}
            >
              <Text style={styles.secondaryText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { margin: 14, backgroundColor: "#e94b4b" },
            ]}
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
        </ScrollView>

        {/* update user information section */}
        <Modal transparent visible={editVisible} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <ScrollView>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Business name"
                  placeholderTextColor="#c7cbd0"
                  style={styles.input}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="you@domain.com"
                  placeholderTextColor="#c7cbd0"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone number"
                  placeholderTextColor="#c7cbd0"
                  style={styles.input}
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Street Address</Text>
                <TextInput
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="Business address"
                  placeholderTextColor="#c7cbd0"
                  style={styles.input}
                />

                {(currentUser?.type ?? "") !== "INDIVIDUAL" && (
                  <>
                    <Text style={styles.label}>Business Name</Text>
                    <TextInput
                      value={editBusinessName}
                      onChangeText={setEditBusinessName}
                      placeholder="Business Name"
                      placeholderTextColor="#c7cbd0"
                      style={styles.input}
                    />
                  </>
                )}

                <Text style={styles.label}>Payment Plan</Text>
                <View style={styles.typeWrap}>
                  {loadingPricing ? (
                    <ActivityIndicator size="large" color="#0ea360" />
                  ) : (
                    pricing
                      .filter(
                        (bt) =>
                          bt.type?.toLowerCase() ===
                          currentUser?.type?.toLowerCase(),
                      )
                      .map((bt) => (
                        <TouchableOpacity
                          key={bt.id}
                          style={[
                            styles.typeItem,
                            editBusinessType === bt.id
                              ? styles.typeItemSelected
                              : undefined,
                          ]}
                          activeOpacity={0.85}
                          onPress={() => setEditBusinessType(bt?.id as string)}
                        >
                          <View style={styles.typeRadioOuter}>
                            {editBusinessType === bt.id ? (
                              <View style={styles.typeRadioInner} />
                            ) : null}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.typeLabel}>{bt.title}</Text>
                            <Text style={styles.typePrice}>{bt.price}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                  )}
                </View>
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
                  style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
                  activeOpacity={0.85}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.primaryText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* forgotten passsword section  */}
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
                  accessibilityLabel={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff color="#5b6b73" />
                  ) : (
                    <Eye color="#5b6b73" />
                  )}
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
                  accessibilityLabel={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff color="#5b6b73" />
                  ) : (
                    <Eye color="#5b6b73" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: "#0ea360", fontSize: 14 }}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f9" },
  container: { paddingBottom: 40 },
  header: { paddingVertical: 14, paddingHorizontal: 14 },
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
    marginTop: 12,
    backgroundColor: "#0ea360",
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
