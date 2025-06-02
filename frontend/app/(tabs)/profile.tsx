import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  FlatList,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { backendGet } from "@/backendAPI/backend";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const handleLogout = async () => {
  await AsyncStorage.removeItem("user_id");
  router.replace("/login");
};

export default function ProfileScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [topAnswers, setTopAnswers] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_id");
        console.log("Loaded user_id:", storedUserId);
        setUserId(storedUserId);
      } catch (error) {
        console.error("Error loading user_id:", error);
      }
    };
    loadUserId();
  }, []);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userResponse = await backendGet(`/user/${userId}`);
        setUserData(userResponse.data || userResponse);

        const topAnswersResponse = await backendGet(
          `/user/${userId}/top-answers`
        );
        setTopAnswers(topAnswersResponse.data || topAnswersResponse || []);

        const rankingResponse = await backendGet(`/user/${userId}/ranking`);
        setRanking(rankingResponse.data || rankingResponse);

        const leaderboardResponse = await backendGet(`/leaderboard?limit=50`);
        setLeaderboard(
          leaderboardResponse.data?.leaderboard ||
            leaderboardResponse?.leaderboard ||
            []
        );
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!userId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in to view your profile.</ThemedText>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text>Go to Login</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        {userData ? (
          <>
            <View style={styles.header}>
              {userData.avatar_url ? (
                <Image
                  source={{ uri: userData.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarPlaceholderText}>
                    {(userData.name || userData.username)
                      ?.charAt(0)
                      .toUpperCase() || "?"}
                  </ThemedText>
                </View>
              )}
              <ThemedText style={styles.username}>
                {userData.name || userData.username || "Unknown User"}
              </ThemedText>
              {userData.total_points !== undefined && (
                <ThemedText style={styles.points}>
                  {userData.total_points} points
                </ThemedText>
              )}
            </View>

            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Top Answers
            </ThemedText>
            {topAnswers && topAnswers.length > 0 ? (
              <FlatList
                style={{ flexGrow: 0 }}
                data={topAnswers.slice(0, 2)}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.answerItem}>
                    <ThemedText style={styles.questionText}>
                      {item.question_text} ({item.date})
                    </ThemedText>
                    <ThemedText style={styles.answerText}>
                      Answer: {item.answer}
                    </ThemedText>
                    <ThemedText style={styles.votesText}>
                      Votes: {item.votes || 0}
                    </ThemedText>
                  </View>
                )}
                ListEmptyComponent={<ThemedText>No answers yet</ThemedText>}
              />
            ) : (
              <ThemedText>No answers yet</ThemedText>
            )}

            <TouchableOpacity
              onPress={() => setShowLeaderboard(true)}
              style={styles.leaderboardButton}
            >
              <Text style={styles.leaderboardButtonText}>
                View Global Leaderboard
              </Text>
            </TouchableOpacity>

            <Modal
              animationType="slide"
              transparent={false}
              visible={showLeaderboard}
              onRequestClose={() => setShowLeaderboard(false)}
            >
              <SafeAreaView style={styles.modalContainer}>
                <ThemedText style={styles.modalTitle}>
                  Global Leaderboard
                </ThemedText>
                {ranking && (
                  <ThemedText style={styles.rankingText}>
                    Your Rank: {ranking.rank} out of {ranking.total_users} users
                  </ThemedText>
                )}
                <FlatList
                  data={leaderboard}
                  keyExtractor={(item) => item.user_id}
                  renderItem={({ item }) => {
                    const isCurrentUser = item.user_id === userId;
                    return (
                      <View
                        style={[
                          styles.leaderboardItem,
                          isCurrentUser && styles.currentUserItem,
                        ]}
                      >
                        <View style={styles.rankContainer}>
                          <ThemedText
                            style={[
                              styles.rankNumber,
                              isCurrentUser && styles.currentUserText,
                            ]}
                          >
                            #{item.rank}
                          </ThemedText>
                        </View>
                        <View style={styles.userInfoContainer}>
                          {item.avatar_url ? (
                            <Image
                              source={{ uri: item.avatar_url }}
                              style={styles.leaderboardAvatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.leaderboardAvatarPlaceholder,
                                isCurrentUser && styles.currentUserAvatar,
                              ]}
                            >
                              <ThemedText style={styles.leaderboardAvatarText}>
                                {(item.name || item.username)
                                  ?.charAt(0)
                                  .toUpperCase() || "?"}
                              </ThemedText>
                            </View>
                          )}
                          <View style={styles.userDetails}>
                            <ThemedText
                              style={[
                                styles.leaderboardUsername,
                                isCurrentUser && styles.currentUserText,
                              ]}
                            >
                              {item.name || item.username}
                              {isCurrentUser && " (You)"}
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.leaderboardPoints,
                                isCurrentUser && styles.currentUserText,
                              ]}
                            >
                              {item.total_points} points
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  }}
                  //   showsVerticalScrollIndicator={true}
                />
                <TouchableOpacity
                  onPress={() => setShowLeaderboard(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Modal>

            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <ThemedText>Unable to load profile data</ThemedText>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: { fontSize: 28, color: "#555" },
  username: { marginTop: 10, fontSize: 24, fontWeight: "bold" },
  points: { marginTop: 5, fontSize: 16, color: "#666" },
  section: { marginTop: 20 },
  sectionTitle: { marginBottom: 10, fontSize: 18, fontWeight: "600" },
  answerItem: {
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  questionText: { fontSize: 14, fontWeight: "500", marginBottom: 5 },
  answerText: { fontStyle: "italic", marginBottom: 5, fontSize: 14 },
  votesText: { fontSize: 12, color: "#666" },
  rankingText: {
    fontSize: 16,
    textAlign: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 15,
    fontWeight: "600",
    marginLeft: 12,
    marginRight: 12,
  },
  leaderboardContainer: {
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  leaderboardList: { maxHeight: 300 },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginLeft: 10,
    marginRight: 10,
  },
  currentUserItem: { backgroundColor: "#007AFF10", borderColor: "#007AFF" },
  rankContainer: { width: 40, alignItems: "center" },
  rankNumber: { fontSize: 16, fontWeight: "bold", color: "#666" },
  currentUserText: { color: "#007AFF" },
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  leaderboardAvatar: { width: 40, height: 40, borderRadius: 20 },
  leaderboardAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  currentUserAvatar: { backgroundColor: "#007AFF20" },
  leaderboardAvatarText: { fontSize: 16, color: "#555", fontWeight: "600" },
  userDetails: { flex: 1, marginLeft: 12 },
  leaderboardUsername: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  leaderboardPoints: { fontSize: 14, color: "#666" },
  logoutButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "white", fontSize: 16, fontWeight: "600" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loginButton: {
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  leaderboardButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  leaderboardButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 12,
    marginRight: 12,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
