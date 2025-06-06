import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { backendGet, api } from "@/backendAPI/backend"; // assumes you've exported `api`
import { router } from "expo-router";

type Group = {
  group_name: string;
  group_size: number;
};

export default function GroupsScreen() {
  // ─── State ───
  const [username, setUsername] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Which sub‐view? "list", "create", or "join"
  const [mode, setMode] = useState<"list" | "create" | "join">("list");

  // Form fields for create/join
  const [formGroupName, setFormGroupName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const colorScheme = useColorScheme();

  // ─── Load current username from AsyncStorage ───
  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("username");
        if (stored) {
          setUsername(stored);
        } else {
          // If no username, send them to login
          router.replace("/login");
        }
      } catch (e) {
        console.error("Error reading username:", e);
        router.replace("/login");
      }
    };
    loadUser();
  }, []);

  // ─── Fetch "My Groups" whenever username changes or after join/create ───
  const fetchGroups = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      const data = await backendGet(`groups/get-groups/${username}`, {});
      setGroups(data.groups || []);
    } catch (e: any) {
      setError(e instanceof Error ? e.message : "Error loading groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [username]);

  // ─── Handlers ───

  // Switch to "Create" mode
  const handleSwitchToCreate = () => {
    setMode("create");
    setFormError(null);
    setFormSuccess(null);
    setFormGroupName("");
    setFormPassword("");
  };

  // Switch to "Join" mode
  const handleSwitchToJoin = () => {
    setMode("join");
    setFormError(null);
    setFormSuccess(null);
    setFormGroupName("");
    setFormPassword("");
  };

  // Switch back to "List" mode
  const handleSwitchToList = () => {
    setMode("list");
    setFormError(null);
    setFormSuccess(null);
  };

  // Create a new group
  const handleCreateGroup = async () => {
    if (!formGroupName.trim() || !formPassword) {
      setFormError("Both group name and password are required.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        group_name: formGroupName.trim(),
        password: formPassword,
        username: username,
      };
      const resp = await api.post("/groups/create-group", payload);
      // On success:
      setFormSuccess("Group created successfully!");
      // Refresh list after a short delay so backend has updated:
      setTimeout(() => {
        setMode("list");
        setFormGroupName("");
        setFormPassword("");
        fetchGroups(); // Directly call fetchGroups instead of relying on username state
      }, 500);
    } catch (err: any) {
      console.error("Error creating group:", err);
      if (err.response) {
        setFormError(err.response.data.error || `Error: ${err.response.status}`);
      } else if (err.request) {
        setFormError("Server not responding. Try again later.");
      } else {
        setFormError("Unexpected error occurred.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Join an existing group
  const handleJoinGroup = async () => {
    if (!formGroupName.trim() || !formPassword) {
      setFormError("Both group name and password are required.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload = {
        group_name: formGroupName.trim(),
        password: formPassword,
        username: username,
      };
      const resp = await api.post("/groups/join-group", payload);
      // On success:
      setFormSuccess("Successfully joined group!");
      setTimeout(() => {
        setMode("list");
        setFormGroupName("");
        setFormPassword("");
        fetchGroups(); // Directly call fetchGroups instead of relying on username state
      }, 500);
    } catch (err: any) {
      console.error("Error joining group:", err);
      if (err.response) {
        setFormError(err.response.data.error || `Error: ${err.response.status}`);
      } else if (err.request) {
        setFormError("Server not responding. Try again later.");
      } else {
        setFormError("Unexpected error occurred.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Navigate to group leaderboard
  const handleGroupPress = (groupName: string) => {
    router.push({
      pathname: "/group-leaderboard",
      params: { groupName },
    });
  };

  // ─── Render ───
  // If still loading the list
  if (loading && mode === "list") {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
        <Text style={[styles.text, { color: Colors[colorScheme ?? "light"].text }]}>
          Loading groups...
        </Text>
      </View>
    );
  }

  // If error loading list
  if (error && mode === "list") {
    return (
      <View style={styles.centeredContainer}>
        <Text style={[styles.text, { color: Colors[colorScheme ?? "light"].text }]}>
          Error: {error}
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleSwitchToCreate}>
          <Text style={styles.buttonText}>Create a New Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSwitchToJoin}>
          <Text style={styles.buttonText}>Join a Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── "My Groups" list view ──
  if (mode === "list") {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>
          Your Groups
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleSwitchToCreate}
          >
            <Text style={styles.actionButtonText}>Create Group</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleSwitchToJoin}
          >
            <Text style={styles.actionButtonText}>Join Group</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scrollView}>
          {groups.length === 0 ? (
            <Text style={[styles.text, { color: Colors[colorScheme ?? "light"].text }]}>
              You're not in any groups yet.
            </Text>
          ) : (
            groups.map((g, idx) => (
              <TouchableOpacity
                key={`${g.group_name}-${idx}`}
                style={[styles.groupButton, { backgroundColor: Colors[colorScheme ?? "light"].background }]}
                onPress={() => handleGroupPress(g.group_name)}
              >
                <Text style={[styles.groupName, { color: Colors[colorScheme ?? "light"].text }]}>
                  {g.group_name}
                </Text>
                <Text style={[styles.groupSize, { color: Colors[colorScheme ?? "light"].text }]}>
                  {g.group_size} member{g.group_size === 1 ? "" : "s"}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ── "Create Group" form ──
  if (mode === "create") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>
          Create a New Group
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
            placeholder="Group Name"
            placeholderTextColor="#666"
            value={formGroupName}
            onChangeText={setFormGroupName}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={formPassword}
            onChangeText={setFormPassword}
          />

          {formError ? (
            <Text style={styles.formError}>{formError}</Text>
          ) : null}
          {formSuccess ? (
            <Text style={styles.formSuccess}>{formSuccess}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateGroup}
            disabled={formLoading}
          >
            {formLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Group</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleSwitchToList}>
            <Text style={[styles.linkButtonText, { color: Colors[colorScheme ?? "light"].text }]}>
              ← Back to My Groups
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── "Join Group" form ──
  if (mode === "join") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}>
          Join a Group
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
            placeholder="Group Name"
            placeholderTextColor="#666"
            value={formGroupName}
            onChangeText={setFormGroupName}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={formPassword}
            onChangeText={setFormPassword}
          />

          {formError ? (
            <Text style={styles.formError}>{formError}</Text>
          ) : null}
          {formSuccess ? (
            <Text style={styles.formSuccess}>{formSuccess}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleJoinGroup}
            disabled={formLoading}
          >
            {formLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Join Group</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleSwitchToList}>
            <Text style={[styles.linkButtonText, { color: Colors[colorScheme ?? "light"].text }]}>
              ← Back to My Groups
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#f9f9f9",
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  groupButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  groupSize: {
    fontSize: 14,
    opacity: 0.7,
  },

  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  footerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  form: {
    marginTop: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  formError: {
    color: "#FF3B30",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  formSuccess: {
    color: "#34C759",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  linkButton: {
    marginTop: 10,
    alignSelf: "center",
  },
  linkButtonText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});