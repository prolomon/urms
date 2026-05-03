import { BusinessType, useAuth, User } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LinearGradient } from "expo-linear-gradient";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { ChevronDown, Eye, EyeOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

interface Agent {
  uid: string;
  fullname: string;
  [key: string]: any;
}

export default function RegisterScreen() {
  const { register, agentList, getBusiness } = useAuth();
  const { success, failed } = useToast();
  const { type } = useLocalSearchParams();

  const isIndividual = type === "individual";

  const [formData, setFormData] = useState<User | null>({
    fullname: "",
    email: "",
    businessType: "",
    businessName: "",
    phone: "",
    password: "",
    confirm: "",
    location: "",
    agent: "",
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [pricing, setPricing] = useState<BusinessType[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);

  useEffect(() => {
    fetchAgents();
    fetchPricing();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const response = await agentList();
      if (response && Array.isArray(response)) {
        setAgents(response);
      }
    } catch (error) {
      failed("Failed to load agents");
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true);
      const response = await getBusiness();
      if (response && Array.isArray(response)) {
        // Filter pricing based on account type
        const filtered = isIndividual
          ? response.filter((item) => item.type === "INDIVIDUAL")
          : response.filter((item) => item.type === "BUSINESS");
        setPricing(filtered);
      }
    } catch (error) {
      failed("Failed to load pricing");
    } finally {
      setLoadingPricing(false);
    }
  };

  const updateField = (key: keyof User, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const res = await register({
      fullname: (formData?.fullname || "").trim(),
      email: (formData?.email || "").trim(),
      password: (formData?.password || "").trim(),
      confirm: (formData?.confirm || "").trim(),
      phone: (formData?.phone || "").trim(),
      businessType: formData?.businessType,
      location: formData?.location,
      agent: (formData?.agent || "").trim(),
      businessName: isIndividual
        ? (formData?.fullname || "").trim()
        : (formData?.businessName || "").trim(),
      type: isIndividual ? "INDIVIDUAL" : "BUSINESS",
    });
    if (!res.ok) {
      failed(res?.message || "Registration failed");
    } else {
      success("Registration successful!");
      router.push("login" as RelativePathString);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Subtle top-right gradient background */}
      <LinearGradient
        colors={["rgba(14,163,96,0.18)", "rgba(14,163,96,0.0)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bgGradient}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header with logo */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Registration section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeSubtitle}>Get started with KURMS</Text>
              <Text style={styles.welcomeDescription}>
                Enter your details to register and access your dashboard
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {isIndividual
                  ? "Individual Registration"
                  : "Business Registration"}
              </Text>

              <Text style={styles.label}>Full name</Text>
              <TextInput
                value={formData?.fullname}
                onChangeText={(value) => updateField("fullname", value)}
                placeholder="Jane Doe"
                placeholderTextColor="#c7cbd0"
                style={styles.input}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                value={formData?.email}
                onChangeText={(value) => updateField("email", value)}
                placeholder="you@domain.com"
                placeholderTextColor="#c7cbd0"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                value={formData?.phone}
                onChangeText={(value) => updateField("phone", value)}
                placeholder="+234 (0) 912 345 6789"
                placeholderTextColor="#c7cbd0"
                style={styles.input}
                keyboardType="phone-pad"
              />

              {!isIndividual && (
                <>
                  <Text style={styles.label}>Business Name</Text>
                  <TextInput
                    value={formData?.businessName}
                    onChangeText={(value) => updateField("businessName", value)}
                    placeholder="Your Business Name"
                    placeholderTextColor="#c7cbd0"
                    style={styles.input}
                    keyboardType="default"
                  />
                </>
              )}

              <Text style={styles.label}>Subscription type</Text>
              <View style={styles.typeWrap}>
                {loadingPricing ? (
                  <ActivityIndicator size="large" color="#0ea360" />
                ) : (
                  pricing.map((bt) => (
                    <TouchableOpacity
                      key={bt.title}
                      style={[
                        styles.typeItem,
                        formData?.businessType === bt.id
                          ? styles.typeItemSelected
                          : undefined,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => updateField("businessType", bt.id)}
                    >
                      <View style={styles.typeRadioOuter}>
                        {formData?.businessType === bt.id ? (
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

              <Text style={styles.label}>Location</Text>
              <TextInput
                value={formData?.location}
                onChangeText={(value) => updateField("location", value)}
                placeholder="Location"
                placeholderTextColor="#c7cbd0"
                style={styles.input}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Select Agent</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowAgentModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectText,
                    !selectedAgent && { color: "#c7cbd0" },
                  ]}
                >
                  {selectedAgent ? selectedAgent.fullname : "Choose an agent"}
                </Text>
                <ChevronDown size={20} color="#5b6b73" />
              </TouchableOpacity>

              <Modal
                visible={showAgentModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAgentModal(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Agent</Text>
                    {loadingAgents ? (
                      <ActivityIndicator size="large" color="#0ea360" />
                    ) : (
                      <FlatList
                        data={agents}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={styles.agentItem}
                            onPress={() => {
                              setSelectedAgent(item);
                              updateField("agent", item.uid);
                              setShowAgentModal(false);
                            }}
                          >
                            <Text style={styles.agentName}>
                              {item.fullname}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    )}
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowAgentModal(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={formData?.password}
                  onChangeText={(value) => updateField("password", value)}
                  placeholder="••••••••"
                  placeholderTextColor="#c7cbd0"
                  style={[styles.input, styles.passwordInput]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#5b6b73" />
                  ) : (
                    <Eye size={20} color="#5b6b73" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={formData?.confirm}
                  onChangeText={(value) => updateField("confirm", value)}
                  placeholder="••••••••"
                  placeholderTextColor="#c7cbd0"
                  style={[styles.input, styles.passwordInput]}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#5b6b73" />
                  ) : (
                    <Eye size={20} color="#5b6b73" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backWrap}
                activeOpacity={0.7}
                onPress={() => router.back()}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={[styles.footerText, styles.loginLink]}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
              <Text style={styles.footerText}>
                © 2026 Karu Revenue Management System
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  bgGradient: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 40,
    paddingTop: 32,
  },
  header: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logoBox: {
    width: 96,
    height: 96,
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
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  welcomeSection: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    color: "#0ea360",
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "left",
    marginBottom: 8,
    lineHeight: 28,
  },
  welcomeDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "left",
    lineHeight: 20,
  },
  formCard: {
    marginHorizontal: 14,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eaeb",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: "#5b6b73",
    fontSize: 13,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 14,
  },
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
  typeLabel: { fontSize: 14, color: "#1a202c", fontWeight: "600" },
  typePrice: { color: "#0ea360", marginTop: 2, fontSize: 12 },
  button: {
    marginTop: 18,
    backgroundColor: "#0ea360",
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backWrap: { marginTop: 12, alignItems: "center" },
  backText: { color: "#0ea360", fontSize: 14 },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 44 },
  toggleButton: {
    position: "absolute",
    right: 12,
    top: 10,
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  selectInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 14, color: "#333" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  agentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e6e9eb",
  },
  agentName: { fontSize: 15, color: "#333" },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#0ea360",
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "600" },
  footer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#6b777b",
    textAlign: "center",
    marginTop: 6,
  },
  loginLink: {
    color: "#0ea360",
    fontSize: 13,
    fontWeight: "600",
  },
});
