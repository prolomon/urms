import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Member, Pricing } from "@/lib/types";
import {
  RelativePathString,
  useRouter
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPricing } from "@/lib/services/pricing";

export default function RegisterScreen() {
  const { register, currentUser } = useAuth();
  const { success, failed } = useToast();
  const initialType = "INDIVIDUAL"
  const initialCategory = "SMALL"

  const [formData, setFormData] = useState<Member | null>({
    fullname: "",
    email: "",
    pricing: [],
    businessName: "",
    location: null,
    phone: "",
    center: "",
    agent: "",
    type: initialType as "BUSINESS" | "INDIVIDUAL",
    category: initialCategory as "SMALL" | "MEDIUM" | "LARGE",
  });
  const router = useRouter();
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const selectedType = formData?.type;
  const selectedCategory = formData?.category;
  const isIndividual = selectedType === "INDIVIDUAL";
  const [loading, setLoading] = useState(false);

  const fetchPricing = useCallback(async () => {
    try {
      setLoadingPricing(true);
      const response = await getPricing(1, 100, currentUser?.center || "", selectedType, selectedCategory);

      if (response.ok) {
        setPricing(response?.data);
      }

    } catch (error: any) {
      failed(error?.message || error?.error || "Failed to load pricing");
    } finally {
      setLoadingPricing(false);
    }
  }, [currentUser?.center, failed, selectedCategory, selectedType]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing, selectedType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPricing();
    setRefreshing(false);
  }, [fetchPricing]);

  const updateField = (key: keyof Member, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const selectAccountType = (value: "INDIVIDUAL" | "BUSINESS") => {
    setFormData((prev: any) => ({
      ...prev,
      type: value,
      pricing: [],
      businessName: value === "INDIVIDUAL" ? prev?.fullname || "" : prev?.businessName || "",
    }));
  };

  const togglePricingSelection = (pricingId: string) => {
    setFormData((prev: any) => {
      const currentPricing = prev?.pricing || [];
      const isSelected = currentPricing.includes(pricingId);
      const updatedPricing = isSelected
        ? currentPricing.filter((id: string) => id !== pricingId)
        : [...currentPricing, pricingId];
      return { ...prev, pricing: updatedPricing };
    });
  };

  const handleSubmit = async () => { 
    setLoading(true);

    try {
      if (!formData?.type) return failed("Select account type");
      if (!formData?.pricing || formData.pricing.length === 0) return failed("Select at least one pricing plan");

      const res = await register({
        fullname: (formData?.fullname || "").trim(),
        email: (formData?.email || "").trim(),
        phone: (formData?.phone || "").trim(),
        agent: (currentUser?.uid || "").trim(),
        businessName: formData?.type === "INDIVIDUAL"
          ? (formData?.fullname || "").trim()
          : (formData?.businessName || "").trim(),
        type: formData?.type,
        center: currentUser?.center || "",
        pricing: formData?.pricing || [],
        category: formData?.category || "SMALL",
      });

      if (!res.ok) {
        failed(res?.message || "Registration failed");
      } else {
        success("Registration successful!");
        setFormData({
          fullname: "",
          email: "",
          pricing: [],
          businessName: "",
          location: null,
          phone: "",
          center: "",
          agent: "",
          type: initialType as "BUSINESS" | "INDIVIDUAL",
          category: initialCategory as "SMALL" | "MEDIUM" | "LARGE",
        });
        router.push("members" as RelativePathString);
      }
    } catch (error: any) {
      failed(error?.message || error?.error || "An error occurred during registration");
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.container}>

            {/* Registration section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Create Account</Text>
              <Text style={styles.welcomeDescription}>
                Enter your member details to register and access your dashboard
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {loading ? (
                <View style={{ paddingVertical: 20, position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.8)", zIndex: 1 }}>
                  <ActivityIndicator size="large" color="#0ea360" />
                </View>
              ) : null}
              <Text style={styles.formTitle}>
                {isIndividual
                  ? "Individual Registration"
                  : "Business Registration"}
              </Text>

              <Text style={styles.label}>Account Type</Text>
              <View style={styles.accountTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.accountTypeCard,
                    selectedType === "INDIVIDUAL" ? styles.accountTypeCardSelected : undefined,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => selectAccountType("INDIVIDUAL")}
                >
                  <View style={styles.typeRadioOuter}>
                    {selectedType === "INDIVIDUAL" ? <View style={styles.typeRadioInner} /> : null}
                  </View>
                  <View>
                    <Text style={styles.accountTypeTitle}>Individual</Text>
                    <Text style={styles.accountTypeSub}>Personal account</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.accountTypeCard,
                    selectedType === "BUSINESS" ? styles.accountTypeCardSelected : undefined,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => selectAccountType("BUSINESS")}
                >
                  <View style={styles.typeRadioOuter}>
                    {selectedType === "BUSINESS" ? <View style={styles.typeRadioInner} /> : null}
                  </View>
                  <View>
                    <Text style={styles.accountTypeTitle}>Business</Text>
                    <Text style={styles.accountTypeSub}>Company account</Text>
                  </View>
                </TouchableOpacity>
              </View>

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

              <Text style={styles.label}>Subscription type (Select one or more)</Text>
              <View style={styles.typeWrap}>
                {loadingPricing ? (
                  <ActivityIndicator size="large" color="#0ea360" />
                ) : (
                  pricing.map((bt) => (
                    <TouchableOpacity
                      key={bt.id}
                      style={[
                        styles.typeItem,
                        formData?.pricing?.includes(bt.id)
                          ? styles.typeItemSelected
                          : undefined,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => togglePricingSelection(bt.id)}
                    >
                      <View style={styles.typeRadioOuter}>
                        {formData?.pricing?.includes(bt.id) ? (
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

              <Text style={styles.label}>Category</Text>
              <View style={styles.accountTypeRow}>
                {["SMALL", "MEDIUM", "LARGE"].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.accountTypeCard,
                      formData?.category === category
                        ? styles.accountTypeCardSelected
                        : undefined,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => updateField("category", category)}
                  >
                    <Text style={styles.accountTypeTitle}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.85}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Register Member</Text>
              </TouchableOpacity>
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
  },
  accountTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  accountTypeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accountTypeCardSelected: {
    borderColor: "#0ea360",
    backgroundColor: "#f2fbf7",
  },
  accountTypeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a202c",
  },
  accountTypeSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
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
});
