import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Briefcase, User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PreferenceScreen() {
  const router = useRouter();

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
        {/* Registration Type Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Choose Registration Type</Text>
          <Text style={styles.welcomeSubtitle}>
            Select how you want to register
          </Text>
          <Text style={styles.welcomeDescription}>
            Register as an individual or business entity to get started with
            Karu Revenue Management System
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            activeOpacity={0.85}
            onPress={() => router.push("/register?type=business")}
          >
            <Briefcase size={48} color="#fff" strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Register as</Text>
            <Text style={[styles.primaryButtonText, styles.buttonAction]}>
              Business
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            activeOpacity={0.85}
            onPress={() => router.push("/register?type=individual")}
          >
            <User size={48} color="#0ea360" strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Register as</Text>
            <Text style={[styles.secondaryButtonText, styles.buttonAction]}>
              Individual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.footerText, styles.backLink]}>
              ← Back to Welcome
            </Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>
            © 2026 Karu Revenue Management System
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
    justifyContent: "center",
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
  buttonContainer: {
    flexDirection: "row",
    gap: "4%",
    paddingHorizontal: 8,
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  button: {
    width: "48%",
    height: 160,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    padding: 16,
  },
  primaryButton: {
    backgroundColor: "#0ea360",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#0ea360",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#0ea360",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 12,
  },
  buttonAction: {
    fontSize: 20,
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    gap: 12,
  },
  footerText: {
    color: "#64748b",
    fontSize: 14,
    opacity: 0.8,
  },
  backLink: {
    fontSize: 18,
    textDecorationLine: "underline",
    opacity: 1,
  },
});
