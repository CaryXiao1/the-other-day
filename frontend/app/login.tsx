import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  View,
} from "react-native";
import { useState } from "react";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { backendGet, auth } from "@/backendAPI/backend";
import { router } from "expo-router";
import { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await auth("/user/login", {
        username: username,
        password: password,
      });
      console.log("Login success:", response.user);

      await AsyncStorage.setItem("user_id", response.user.user_id);
      await AsyncStorage.setItem(
        "username",
        response.user.username || username
      );

      router.push("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        setError("Invalid username or password");
      } else if (axiosError.request) {
        setError("Server is not responding. Please try again later.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setShowError(true);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <ThemedView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showError}
        onRequestClose={() => setShowError(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowError(false)}
            >
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ThemedView style={styles.formContainer}>
        <View style={styles.titleColumn}>
          <Ionicons
            name="book"
            size={32}
            color="#c0d684"
            style={styles.bookIcon}
          />
          <ThemedText type="title" style={styles.title}>
            the other day...
          </ThemedText>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <ThemedText style={styles.loginButtonText}>Log In</ThemedText>
        </TouchableOpacity>

        <ThemedView style={styles.registerContainer}>
          <ThemedText style={styles.registerText}>
            Don't have an account?{" "}
          </ThemedText>
          <TouchableOpacity onPress={handleRegister}>
            <ThemedText style={styles.registerLink}>Register</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  bookIcon: {
    transform: [{ translateY: -2 }],
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    padding: 20,
    borderRadius: 10,
    gap: 16,
  },
  titleColumn: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: Platform.select({
      ios: "#fff",
      android: "#fff",
      web: "#fff",
    }),
  },
  loginButton: {
    backgroundColor: "#63264a",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 15,
  },
  forgotPasswordText: {
    color: "#63264a",
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
  },
  registerLink: {
    color: "#c0d684",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxWidth: 400,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
