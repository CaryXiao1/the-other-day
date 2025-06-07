import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  View,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useState } from "react";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { auth } from "@/backendAPI/backend";
import { AxiosError } from "axios";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      setShowError(true);
      return;
    }
    if (!password.trim()) {
      setError("Password cannot be empty");
      setShowError(true);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShowError(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await auth("/user/register", {
        username: username,
        password: password,
      });
      router.push({
        pathname: "/norms",
        params: { username: username, user_id: response.user_id },
      });
    } catch (error) {
      console.error("Registration error:", error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        setError("Username already exists");
      } else if (axiosError.request) {
        setError("Server is not responding. Please try again later.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/");
  };

  return (
    <LinearGradient
      colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name="person-add" size={32} color="#fff" />
              </View>
            </View>
            <ThemedText style={styles.appTitle}>
              Join the conversation
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Create your account to get started
            </ThemedText>
            <View style={styles.headerDivider} />
          </View>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(236, 72, 153, 0.1)", "rgba(168, 85, 247, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.registerBadge}>
                  <ThemedText style={styles.badgeText}>
                    CREATE ACCOUNT
                  </ThemedText>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.modernInput}
                    placeholder="Choose a username"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.modernInput}
                    placeholder="Create a password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.modernInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.registerButton,
                    isLoading && styles.registerButtonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <ThemedText style={styles.registerButtonText}>
                        Create Account
                      </ThemedText>
                      <ThemedText style={styles.registerArrow}>→</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.loginSection}>
                <ThemedText style={styles.loginText}>
                  Already have an account?
                </ThemedText>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleBackToLogin}
                >
                  <ThemedText style={styles.loginButtonText}>
                    Sign In
                  </ThemedText>
                  <ThemedText style={styles.loginArrow}>→</ThemedText>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showError}
          onRequestClose={() => setShowError(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} style={styles.modalBlur}>
              <LinearGradient
                colors={["rgba(239, 68, 68, 0.1)", "rgba(220, 38, 38, 0.05)"]}
                style={styles.modalGradient}
              >
                <View style={styles.errorIcon}>
                  <Ionicons name="alert-circle" size={24} color="#EF4444" />
                </View>
                <ThemedText style={styles.errorTitle}>Oops!</ThemedText>
                <ThemedText style={styles.errorMessage}>{error}</ThemedText>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowError(false)}
                >
                  <ThemedText style={styles.modalButtonText}>Got it</ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  appTitle: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "300",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  headerDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#EC4899",
    marginTop: 16,
    borderRadius: 1,
  },
  glassCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  registerBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 1,
  },
  inputContainer: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  modernInput: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
    fontWeight: "400",
  },
  registerButton: {
    backgroundColor: "rgba(236, 72, 153, 0.8)",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerArrow: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "300",
  },
  loginSection: {
    alignItems: "center",
    gap: 16,
  },
  loginText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "400",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  loginButtonText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
  },
  loginArrow: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "300",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBlur: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    width: "100%",
    maxWidth: 340,
  },
  modalGradient: {
    padding: 24,
    alignItems: "center",
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: "rgba(139, 92, 246, 0.8)",
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
