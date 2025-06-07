import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { backendGet, api } from "@/backendAPI/backend";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type Group = {
  group_name: string;
  group_size: number;
};

export default function GroupsScreen() {
  const [username, setUsername] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"list" | "create" | "join">("list");

  const [formGroupName, setFormGroupName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("username");
        if (stored) {
          setUsername(stored);
        } else {
          router.replace("/login");
        }
      } catch (e) {
        console.error("Error reading username:", e);
        router.replace("/login");
      }
    };
    loadUser();
  }, []);

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

  const handleSwitchToCreate = () => {
    setMode("create");
    setFormError(null);
    setFormSuccess(null);
    setFormGroupName("");
    setFormPassword("");
  };

  const handleSwitchToJoin = () => {
    setMode("join");
    setFormError(null);
    setFormSuccess(null);
    setFormGroupName("");
    setFormPassword("");
  };

  const handleSwitchToList = () => {
    setMode("list");
    setFormError(null);
    setFormSuccess(null);
  };

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
      setFormSuccess("Group created successfully!");
      setTimeout(() => {
        setMode("list");
        setFormGroupName("");
        setFormPassword("");
        fetchGroups();
      }, 500);
    } catch (err: any) {
      console.error("Error creating group:", err);
      if (err.response) {
        setFormError(
          err.response.data.error || `Error: ${err.response.status}`
        );
      } else if (err.request) {
        setFormError("Server not responding. Try again later.");
      } else {
        setFormError("Unexpected error occurred.");
      }
    } finally {
      setFormLoading(false);
    }
  };

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
      setFormSuccess("Successfully joined group!");
      setTimeout(() => {
        setMode("list");
        setFormGroupName("");
        setFormPassword("");
        fetchGroups();
      }, 500);
    } catch (err: any) {
      console.error("Error joining group:", err);
      if (err.response) {
        setFormError(
          err.response.data.error || `Error: ${err.response.status}`
        );
      } else if (err.request) {
        setFormError("Server not responding. Try again later.");
      } else {
        setFormError("Unexpected error occurred.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleGroupPress = (groupName: string) => {
    router.push({
      pathname: "/group-leaderboard",
      params: { groupName },
    });
  };

  if (!username) {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Initializing...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (mode === "list") {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <ThemedText style={styles.greeting}>Your Groups</ThemedText>
              <ThemedText style={styles.username}>{username}</ThemedText>
              <View style={styles.headerDivider} />
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSwitchToCreate}
              >
                <BlurView intensity={20} style={styles.actionButtonBlur}>
                  <LinearGradient
                    colors={[
                      "rgba(139, 92, 246, 0.2)",
                      "rgba(139, 92, 246, 0.1)",
                    ]}
                    style={styles.actionButtonGradient}
                  >
                    <ThemedText style={styles.actionButtonText}>
                      Create Group
                    </ThemedText>
                    <ThemedText style={styles.actionButtonIcon}>+</ThemedText>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSwitchToJoin}
              >
                <BlurView intensity={20} style={styles.actionButtonBlur}>
                  <LinearGradient
                    colors={[
                      "rgba(34, 197, 94, 0.2)",
                      "rgba(34, 197, 94, 0.1)",
                    ]}
                    style={styles.actionButtonGradient}
                  >
                    <ThemedText style={styles.actionButtonText}>
                      Join Group
                    </ThemedText>
                    <ThemedText style={styles.actionButtonIcon}>→</ThemedText>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            </View>

            <BlurView intensity={20} style={styles.glassCard}>
              <LinearGradient
                colors={["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.groupsBadge}>
                    <ThemedText style={styles.badgeText}>MY GROUPS</ThemedText>
                  </View>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#3B82F6" />
                    <ThemedText style={styles.loadingQuestionText}>
                      Loading groups...
                    </ThemedText>
                  </View>
                ) : error ? (
                  <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                  </View>
                ) : groups.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>
                      You're not in any groups yet
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      Create or join a group to get started
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.groupsList}>
                    {groups.map((group, idx) => (
                      <TouchableOpacity
                        key={`${group.group_name}-${idx}`}
                        style={styles.groupItem}
                        onPress={() => handleGroupPress(group.group_name)}
                      >
                        <BlurView intensity={10} style={styles.groupBlur}>
                          <View style={styles.groupContent}>
                            <View style={styles.groupInfo}>
                              <ThemedText style={styles.groupName}>
                                {group.group_name}
                              </ThemedText>
                              <ThemedText style={styles.groupSize}>
                                {group.group_size} member
                                {group.group_size === 1 ? "" : "s"}
                              </ThemedText>
                            </View>
                            <View style={styles.groupArrow}>
                              <ThemedText style={styles.groupArrowText}>
                                →
                              </ThemedText>
                            </View>
                          </View>
                        </BlurView>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </BlurView>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (mode === "create") {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.formContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerContainer}>
                <ThemedText style={styles.greeting}>Create Group</ThemedText>
                <ThemedText style={styles.username}>New Community</ThemedText>
                <View style={styles.headerDivider} />
              </View>

              <BlurView intensity={20} style={styles.glassCard}>
                <LinearGradient
                  colors={[
                    "rgba(139, 92, 246, 0.1)",
                    "rgba(139, 92, 246, 0.05)",
                  ]}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.createBadge}>
                      <ThemedText style={styles.badgeText}>CREATE</ThemedText>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.modernInput}
                      placeholder="Group Name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formGroupName}
                      onChangeText={setFormGroupName}
                      autoCapitalize="none"
                    />

                    <TextInput
                      style={styles.modernInput}
                      placeholder="Password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry
                      value={formPassword}
                      onChangeText={setFormPassword}
                    />

                    {formError && (
                      <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>
                          {formError}
                        </ThemedText>
                      </View>
                    )}

                    {formSuccess && (
                      <View style={styles.successContainer}>
                        <ThemedText style={styles.successText}>
                          {formSuccess}
                        </ThemedText>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        formLoading && styles.submitButtonDisabled,
                      ]}
                      onPress={handleCreateGroup}
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <ThemedText style={styles.submitButtonText}>
                            Create Group
                          </ThemedText>
                          <ThemedText style={styles.submitArrow}>+</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleSwitchToList}
                    >
                      <ThemedText style={styles.backButtonText}>
                        ← Back to Groups
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (mode === "join") {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.formContainer}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.headerContainer}>
                <ThemedText style={styles.greeting}>Join Group</ThemedText>
                <ThemedText style={styles.username}>Find Community</ThemedText>
                <View style={styles.headerDivider} />
              </View>

              <BlurView intensity={20} style={styles.glassCard}>
                <LinearGradient
                  colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)"]}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.joinBadge}>
                      <ThemedText style={styles.badgeText}>JOIN</ThemedText>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.modernInput}
                      placeholder="Group Name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={formGroupName}
                      onChangeText={setFormGroupName}
                      autoCapitalize="none"
                    />

                    <TextInput
                      style={styles.modernInput}
                      placeholder="Password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry
                      value={formPassword}
                      onChangeText={setFormPassword}
                    />

                    {formError && (
                      <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>
                          {formError}
                        </ThemedText>
                      </View>
                    )}

                    {formSuccess && (
                      <View style={styles.successContainer}>
                        <ThemedText style={styles.successText}>
                          {formSuccess}
                        </ThemedText>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        formLoading && styles.submitButtonDisabled,
                        { backgroundColor: "rgba(34, 197, 94, 0.8)" },
                      ]}
                      onPress={handleJoinGroup}
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <ThemedText style={styles.submitButtonText}>
                            Join Group
                          </ThemedText>
                          <ThemedText style={styles.submitArrow}>→</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleSwitchToList}
                    >
                      <ThemedText style={styles.backButtonText}>
                        ← Back to Groups
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 40,
  },
  formContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "300",
  },
  loadingQuestionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    marginTop: 12,
  },

  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
    marginTop: 5,
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  headerDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#8B5CF6",
    marginTop: 16,
    borderRadius: 1,
  },

  actionButtonsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionButtonBlur: {
    padding: 20,
  },
  actionButtonGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  groupsBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  createBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  joinBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 1,
  },

  groupsList: {
    gap: 16,
  },
  groupItem: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  groupBlur: {
    padding: 20,
  },
  groupContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  groupSize: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  groupArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  groupArrowText: {
    color: "#fff",
    fontSize: 16,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  inputContainer: {
    gap: 16,
  },
  modernInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  submitButton: {
    backgroundColor: "rgba(139, 92, 246, 0.8)",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitArrow: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "300",
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
  },

  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  successContainer: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  successText: {
    color: "#22C55E",
    fontSize: 14,
    textAlign: "center",
  },
});
