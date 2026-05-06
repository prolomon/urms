import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LinearGradient } from "expo-linear-gradient";
import { RelativePathString, useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [entityId, setEntityId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { success, failed } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {

      const res = await login(entityId.trim(), password);

      if (!res.ok) {
        failed(res.message || res.error || "Login failed");
      } else {
        success("Login successful!");
        router.replace("/pages/(pages)" as RelativePathString);
      }

    } catch (error: any) {

      failed(error?.message || error?.error ||"An error occurred during login");

    } finally {

      setLoading(false);
      
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Subtle top-right gradient background to match pattern */}
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

            {/* Header with logo (same as index/preference) */}
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Image
                  source={require("../assets/images/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Welcome / Title section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome back</Text>
              <Text style={styles.welcomeSubtitle}>Sign in to AURMS</Text>
              <Text style={styles.welcomeDescription}>
                Enter your credentials to access your dashboard
              </Text>
            </View>

            {/* Form section */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={entityId}
                onChangeText={setEntityId}
                placeholder="amac@karu.ac.ke"
                placeholderTextColor="#9aa3aa"
                style={styles.input}
                keyboardType="default"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9aa3aa"
                  style={[styles.input, { paddingRight: 44 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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
                style={[styles.button, styles.primaryButton]}
                activeOpacity={0.85}
                onPress={handleSubmit}
              >
                <Text style={styles.primaryButtonText}>{loading ? "Signing In..." : "Sign In"}</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} Tr3-G Innovation Limited
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
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 40,
    paddingTop: 60,
  },
  header: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
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
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    color: "#0ea360",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "left",
  },
  welcomeSubtitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "left",
    marginBottom: 10,
    lineHeight: 30,
  },
  welcomeDescription: {
    fontSize: 18,
    color: "#334155",
    textAlign: "left",
    lineHeight: 26,
  },
  formSection: {
    paddingHorizontal: 16,
    gap: 6,
  },
  label: { marginTop: 8, marginBottom: 6, color: "#5b6b73" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e6e9eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  eyeToggle: {
    position: "absolute",
    right: 10,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  button: {
    marginTop: 18,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 20,
  },
  primaryButton: { backgroundColor: "#0ea360" },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    gap: 12,
  },
  footerText: { color: "#64748b", fontSize: 14, opacity: 0.8 },
  backLink: { fontSize: 18, textDecorationLine: "underline", opacity: 1 },
});
