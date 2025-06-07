import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { backendGet } from "@/backendAPI/backend";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type LeaderboardEntry = {
  _id: string;
  username: string;
  name?: string;
  avatar_url?: string;
  total_points: number;
  rank: number;
};

type AnswerLeaderboardEntry = {
  answer: {
    _id: string;
    answer_text: string;
    votes: number;
    appearances: number;
  };
  user: {
    _id: string;
    username: string;
    name?: string;
    avatar_url?: string;
  };
};

export default function GroupLeaderboardScreen() {
  const { groupName } = useLocalSearchParams<{ groupName: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answerLeaderboard, setAnswerLeaderboard] = useState<
    AnswerLeaderboardEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yesterdayQuestion, setYesterdayQuestion] = useState<{
    _id: string;
    question: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaderboardData = await backendGet(
          `groups/leaderboard/${groupName}`,
          {}
        );
        setLeaderboard(leaderboardData.leaderboard || []);
        const otherDayData = await backendGet(
          "/day-before-yesterday/get-question/",
          {}
        );
        setYesterdayQuestion(otherDayData);

        if (otherDayData && otherDayData._id) {
          const answerData = await backendGet(
            `/groups/${groupName}/answer-leaderboard/${otherDayData._id}`,
            {}
          );
          setAnswerLeaderboard(answerData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupName]);

  if (loading) {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <ThemedText style={styles.loadingText}>
              Loading leaderboard...
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={["#0F0F23", "#1A1A3E", "#2D1B69"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ThemedText style={styles.backButtonText}>← Go Back</ThemedText>
            </TouchableOpacity>
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
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <ThemedText style={styles.greeting}>Leaderboard</ThemedText>
              <ThemedText style={styles.groupName}>{groupName}</ThemedText>
              <View style={styles.headerDivider} />
            </View>
          </View>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.pointsBadge}>
                  <ThemedText style={styles.badgeText}>
                    OVERALL POINTS
                  </ThemedText>
                </View>
              </View>

              {leaderboard.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                    No members found
                  </ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    Check back when group members start earning points
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.leaderboardList}>
                  {leaderboard.map((entry, index) => (
                    <View key={entry._id} style={styles.leaderboardItem}>
                      <BlurView intensity={10} style={styles.itemBlur}>
                        <View style={styles.itemContent}>
                          <View style={styles.rankContainer}>
                            <View
                              style={[
                                styles.rankBadge,
                                index === 0 && styles.goldRank,
                                index === 1 && styles.silverRank,
                                index === 2 && styles.bronzeRank,
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.rankText,
                                  index < 3 && styles.topRankText,
                                ]}
                              >
                                #{entry.rank}
                              </ThemedText>
                            </View>
                          </View>
                          <View style={styles.userInfo}>
                            <ThemedText style={styles.usernameText}>
                              {entry.username}
                            </ThemedText>
                            <ThemedText style={styles.pointsText}>
                              {entry.total_points} points
                            </ThemedText>
                          </View>
                          {index < 3 && (
                            <View style={styles.trophyContainer}>
                              <ThemedText style={styles.trophyIcon}>
                                {index === 0 ? "🏆" : index === 1 ? "🥈" : "🥉"}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </BlurView>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </BlurView>

          {yesterdayQuestion && (
            <BlurView intensity={20} style={styles.glassCard}>
              <LinearGradient
                colors={["rgba(139, 92, 246, 0.1)", "rgba(139, 92, 246, 0.05)"]}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.questionBadge}>
                    <ThemedText style={styles.badgeText}>
                      THE OTHER DAY
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.questionContainer}>
                  <ThemedText style={styles.questionText}>
                    "{yesterdayQuestion.question}"
                  </ThemedText>
                </View>

                {answerLeaderboard.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <ThemedText style={styles.emptyText}>
                      No answers found
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      Be the first to answer tomorrow's question
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.answersList}>
                    {answerLeaderboard.map((entry, index) => (
                      <View key={entry.answer._id} style={styles.answerItem}>
                        <BlurView intensity={10} style={styles.itemBlur}>
                          <View style={styles.answerContent}>
                            <View style={styles.answerRankContainer}>
                              <View
                                style={[
                                  styles.answerRankBadge,
                                  index === 0 && styles.goldRank,
                                  index === 1 && styles.silverRank,
                                  index === 2 && styles.bronzeRank,
                                ]}
                              >
                                <ThemedText
                                  style={[
                                    styles.answerRankText,
                                    index < 3 && styles.topRankText,
                                  ]}
                                >
                                  #{index + 1}
                                </ThemedText>
                              </View>
                            </View>
                            <View style={styles.answerInfo}>
                              <ThemedText style={styles.answerText}>
                                {entry.answer.answer_text}
                              </ThemedText>
                              <ThemedText style={styles.answerAuthor}>
                                — {entry.user.username}
                              </ThemedText>
                              <View style={styles.answerStats}>
                                <View style={styles.statItem}>
                                  <ThemedText style={styles.statLabel}>
                                    Votes
                                  </ThemedText>
                                  <ThemedText style={styles.statValue}>
                                    {entry.answer.votes}
                                  </ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                  <ThemedText style={styles.statLabel}>
                                    Appearances
                                  </ThemedText>
                                  <ThemedText style={styles.statValue}>
                                    {entry.answer.appearances}
                                  </ThemedText>
                                </View>
                              </View>
                            </View>
                          </View>
                        </BlurView>
                      </View>
                    ))}
                  </View>
                )}
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
    paddingTop: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  groupName: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: -0.5,
    textAlign: "center",
    lineHeight: 35,
  },
  headerDivider: {
    width: 60,
    height: 2,
    backgroundColor: "#8B5CF6",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  pointsBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
  questionBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 1,
  },

  leaderboardList: {
    gap: 16,
  },
  leaderboardItem: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  itemBlur: {
    padding: 20,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rankContainer: {
    alignItems: "center",
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  goldRank: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  silverRank: {
    backgroundColor: "rgba(192, 192, 192, 0.2)",
    borderColor: "rgba(192, 192, 192, 0.4)",
  },
  bronzeRank: {
    backgroundColor: "rgba(205, 127, 50, 0.2)",
    borderColor: "rgba(205, 127, 50, 0.4)",
  },
  rankText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  topRankText: {
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  usernameText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  trophyContainer: {
    alignItems: "center",
  },
  trophyIcon: {
    fontSize: 24,
  },

  questionContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  questionText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 24,
  },

  answersList: {
    gap: 16,
  },
  answerItem: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  answerContent: {
    flexDirection: "row",
    gap: 16,
  },
  answerRankContainer: {
    alignItems: "center",
  },
  answerRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  answerRankText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  answerInfo: {
    flex: 1,
  },
  answerText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 22,
  },
  answerAuthor: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
    fontStyle: "italic",
  },
  answerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
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

  backButton: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
  },
});
