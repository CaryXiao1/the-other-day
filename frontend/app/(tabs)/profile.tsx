import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { backendGet } from "@/backendAPI/backend";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const handleLogout = async () => {
  await AsyncStorage.removeItem("user_id");
  router.replace("/login");
};

const LoadingScreen = () => (
  <LinearGradient
    colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
    style={styles.container}
  >
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <ThemedText style={styles.loadingText}>
        Loading your profile...
      </ThemedText>
      <View style={styles.loadingPlaceholders}>
        <View style={styles.avatarLoadingPlaceholder} />
        <View style={styles.textLoadingPlaceholder} />
        <View style={[styles.textLoadingPlaceholder, { width: 100 }]} />
      </View>
    </View>
  </LinearGradient>
);

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

  if (loading || (userId && !userData)) {
    return <LoadingScreen />;
  }

  if (!userId) {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.errorContainer}>
            <BlurView intensity={20} style={styles.glassCard}>
              <LinearGradient
                colors={["rgba(239, 68, 68, 0.1)", "rgba(220, 38, 38, 0.05)"]}
                style={styles.cardGradient}
              >
                <ThemedText style={styles.errorTitle}>
                  Authentication Required
                </ThemedText>
                <ThemedText style={styles.errorText}>
                  Please log in to view your profile.
                </ThemedText>
                <TouchableOpacity
                  onPress={() => router.replace("/login")}
                  style={styles.loginButton}
                >
                  <ThemedText style={styles.loginButtonText}>
                    Go to Login
                  </ThemedText>
                  <ThemedText style={styles.buttonArrow}>→</ThemedText>
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          {userData ? (
            <>
              <BlurView intensity={20} style={styles.glassCard}>
                <LinearGradient
                  colors={[
                    "rgba(139, 92, 246, 0.1)",
                    "rgba(59, 130, 246, 0.05)",
                  ]}
                  style={styles.cardGradient}
                >
                  <View style={styles.profileHeader}>
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

                    <View style={styles.profileInfo}>
                      <ThemedText style={styles.username}>
                        {userData.name || userData.username || "Unknown User"}
                      </ThemedText>
                      {userData.total_points !== undefined && (
                        <View style={styles.pointsBadge}>
                          <ThemedText style={styles.pointsText}>
                            {userData.total_points} points
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>

              {/* Top Answers Card */}
              <BlurView intensity={20} style={styles.glassCard}>
                <LinearGradient
                  colors={[
                    "rgba(236, 72, 153, 0.1)",
                    "rgba(168, 85, 247, 0.05)",
                  ]}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.sectionBadge}>
                      <ThemedText style={styles.badgeText}>
                        TOP ANSWERS
                      </ThemedText>
                    </View>
                  </View>

                  {topAnswers && topAnswers.length > 0 ? (
                    <View style={styles.answersContainer}>
                      {topAnswers.slice(0, 2).map((item) => (
                        <BlurView
                          key={item._id}
                          intensity={10}
                          style={styles.answerCard}
                        >
                          <View style={styles.answerContent}>
                            <ThemedText style={styles.questionText}>
                              {item.question_text}
                            </ThemedText>
                            <ThemedText style={styles.answerText}>
                              "{item.answer_text}"
                            </ThemedText>
                            <View style={styles.answerMeta}>
                              <ThemedText style={styles.dateText}>
                                {item.date}
                              </ThemedText>
                              <View style={styles.votesContainer}>
                                <ThemedText style={styles.votesText}>
                                  {item.votes || 0} ♥
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                        </BlurView>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyText}>
                        No answers yet. Start participating to see your top
                        answers here!
                      </ThemedText>
                    </View>
                  )}
                </LinearGradient>
              </BlurView>

              <BlurView intensity={20} style={styles.glassCard}>
                <LinearGradient
                  colors={[
                    "rgba(34, 197, 94, 0.1)",
                    "rgba(16, 185, 129, 0.05)",
                  ]}
                  style={styles.cardGradient}
                >
                  <TouchableOpacity
                    onPress={() => setShowLeaderboard(true)}
                    style={styles.actionButton}
                  >
                    <View style={styles.buttonContent}>
                      <ThemedText style={styles.actionButtonText}>
                        View Global Leaderboard
                      </ThemedText>
                      <ThemedText style={styles.buttonArrow}>→</ThemedText>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleLogout}
                    style={[styles.actionButton, styles.logoutButton]}
                  >
                    <View style={styles.buttonContent}>
                      <ThemedText style={styles.logoutButtonText}>
                        Log Out
                      </ThemedText>
                      <ThemedText style={styles.logoutArrow}>→</ThemedText>
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>

              <Modal
                animationType="slide"
                transparent={false}
                visible={showLeaderboard}
                onRequestClose={() => setShowLeaderboard(false)}
              >
                <LinearGradient
                  colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
                  style={styles.modalContainer}
                >
                  <SafeAreaView style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <ThemedText style={styles.modalTitle}>
                        Global Leaderboard
                      </ThemedText>
                      {ranking && (
                        <BlurView intensity={10} style={styles.rankingCard}>
                          <ThemedText style={styles.rankingText}>
                            Your Rank: #{ranking.rank} out of{" "}
                            {ranking.total_users} users
                          </ThemedText>
                        </BlurView>
                      )}
                    </View>

                    <ScrollView
                      contentContainerStyle={styles.leaderboardScrollContainer}
                      showsVerticalScrollIndicator={false}
                    >
                      {leaderboard.map((item) => {
                        const isCurrentUser = item.user_id === userId;
                        return (
                          <BlurView
                            key={item.user_id}
                            intensity={15}
                            style={[
                              styles.leaderboardItem,
                              isCurrentUser && styles.currentUserItem,
                            ]}
                          >
                            <View style={styles.rankContainer}>
                              <View
                                style={[
                                  styles.rankBadge,
                                  item.rank === 1 && styles.firstPlace,
                                  item.rank === 2 && styles.secondPlace,
                                  item.rank === 3 && styles.thirdPlace,
                                  isCurrentUser && styles.currentUserRank,
                                ]}
                              >
                                <ThemedText
                                  style={[
                                    styles.rankNumber,
                                    item.rank <= 3 && styles.topRankNumber,
                                    isCurrentUser && styles.currentUserText,
                                  ]}
                                >
                                  {item.rank}
                                </ThemedText>
                              </View>
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
                                  <ThemedText
                                    style={styles.leaderboardAvatarText}
                                  >
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
                          </BlurView>
                        );
                      })}
                    </ScrollView>

                    <TouchableOpacity
                      onPress={() => setShowLeaderboard(false)}
                      style={styles.closeButton}
                    >
                      <ThemedText style={styles.closeButtonText}>
                        Close
                      </ThemedText>
                    </TouchableOpacity>
                  </SafeAreaView>
                </LinearGradient>
              </Modal>
            </>
          ) : (
            <BlurView intensity={20} style={styles.glassCard}>
              <LinearGradient
                colors={["rgba(239, 68, 68, 0.1)", "rgba(220, 38, 38, 0.05)"]}
                style={styles.cardGradient}
              >
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorTitle}>
                    Unable to load profile
                  </ThemedText>
                  <ThemedText style={styles.errorText}>
                    There was an error loading your profile data.
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => router.replace("/login")}
                    style={styles.loginButton}
                  >
                    <ThemedText style={styles.loginButtonText}>
                      Go to Login
                    </ThemedText>
                    <ThemedText style={styles.buttonArrow}>→</ThemedText>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "300",
  },
  loadingPlaceholders: {
    marginTop: 40,
    alignItems: "center",
  },
  avatarLoadingPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  textLoadingPlaceholder: {
    height: 20,
    width: 150,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    marginBottom: 10,
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

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  profileInfo: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  avatarPlaceholderText: {
    fontSize: 32,
    color: "#8B5CF6",
    fontWeight: "600",
    lineHeight: 30,
  },
  username: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  pointsBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  pointsText: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "600",
  },

  sectionBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 1,
  },

  answersContainer: {
    gap: 16,
  },
  answerCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  answerContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    lineHeight: 22,
  },
  answerText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontStyle: "italic",
    lineHeight: 21,
    marginBottom: 12,
  },
  answerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "400",
  },
  votesContainer: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  votesText: {
    fontSize: 12,
    color: "#EC4899",
    fontWeight: "600",
  },

  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
  },

  actionButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    marginBottom: 0,
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  buttonArrow: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "300",
  },
  logoutArrow: {
    fontSize: 18,
    color: "#EF4444",
    fontWeight: "300",
  },

  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  rankingCard: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  rankingText: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "600",
    textAlign: "center",
  },

  leaderboardScrollContainer: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  currentUserItem: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  rankContainer: {
    width: 50,
    alignItems: "center",
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  firstPlace: {
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  secondPlace: {
    backgroundColor: "rgba(156, 163, 175, 0.2)",
    borderColor: "rgba(156, 163, 175, 0.4)",
  },
  thirdPlace: {
    backgroundColor: "rgba(205, 127, 50, 0.2)",
    borderColor: "rgba(205, 127, 50, 0.4)",
  },
  currentUserRank: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  topRankNumber: {
    color: "#fff",
  },
  currentUserText: {
    color: "#8B5CF6",
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  leaderboardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  leaderboardAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  currentUserAvatar: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  leaderboardAvatarText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardUsername: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 2,
  },
  leaderboardPoints: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "400",
  },

  closeButton: {
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    width: "90%",
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  errorContainer: {
    alignItems: "center",
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    color: "#EF4444",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: "rgba(139, 92, 246, 0.8)",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
