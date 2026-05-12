import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
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

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the</Text>
          <Text style={styles.welcomeSubtitle}>
            Amac Unified Revenue Management System (AURMS)
          </Text>
          <Text style={styles.welcomeDescription}>
            Streamline your personal or business revenue management with ease
            and efficiency
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>
              Already a member? Sign In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} TR3-G Innovation Limited
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
    marginBottom: 30,
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
  },
  welcomeDescription: {
    fontSize: 18,
    color: "#334155",
    textAlign: "left",
    lineHeight: 26,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  primaryButton: {
    backgroundColor: "#0ea360",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#0ea360",
  },
  secondaryButtonText: {
    color: "#0ea360",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
  },
  footerText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    opacity: 0.8,
  },
});
