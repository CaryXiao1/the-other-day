import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useState, useEffect } from "react";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { backendGet } from "@/backendAPI/backend";
import { api } from "@/backendAPI/backend";
import axios, { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

type Question = {
  _id: string;
  question: string;
  date: string;
};

type Answer = {
  _id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  votes?: number;
  appearances?: number;
  question_text: string;
  date: string;
};

type LeaderboardEntry = {
  answer: Answer;
  user: {
    _id: string;
    username: string;
    name?: string;
    avatar_url?: string;
  };
};

export default function HomeScreen() {
  const [username, setUsername] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);

  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [todayAnswerText, setTodayAnswerText] = useState("");
  const [isSubmittingTodayAnswer, setIsSubmittingTodayAnswer] = useState(false);
  const [todayError, setTodayError] = useState("");

  useEffect(() => {
    const checkHasAnsweredToday = async () => {
      if (!userId) return;

      try {
        const data = await backendGet(`/today/has-answered/${userId}`);
        setHasAnsweredToday(data.has_answered);
      } catch (err) {
        console.warn("Could not check if user has answered today:", err);
        setHasAnsweredToday(false);
      }
    };

    checkHasAnsweredToday();
  }, [userId]);

  const [yesterdayQuestion, setYesterdayQuestion] = useState<Question | null>(
    null
  );
  const [dayBeforeYesterdayQuestion, setDayBeforeYesterdayQuestion] =
    useState<Question | null>(null);
  const [pairAnswers, setPairAnswers] = useState<Answer[]>([]);
  const [loadingPair, setLoadingPair] = useState(false);
  const [pairError, setPairError] = useState("");

  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("user_id");
        const storedUsername = await AsyncStorage.getItem("username");

        console.log("Loaded user_id:", storedUserId);
        console.log("Loaded username:", storedUsername);

        if (storedUserId) {
          setUserId(storedUserId);
        }

        if (storedUsername) {
          setUsername(storedUsername);
        }

        if (!storedUserId || !storedUsername) {
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        router.replace("/login");
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const data: Question = await backendGet("/today/get-question/");
        setTodayQuestion(data);
      } catch (err) {
        console.warn("Could not fetch today's question:", err);
        setTodayError("No question found for today or server error.");
      }
    };
    fetchToday();
  }, []);

  useEffect(() => {
    const fetchYesterdayData = async () => {
      try {
        const data: Question = await backendGet("/yesterday/get-question/");
        setYesterdayQuestion(data);
        const dayBeforeYesterdayData: Question = await backendGet(
          "/day-before-yesterday/get-question/"
        );
        setDayBeforeYesterdayQuestion(dayBeforeYesterdayData);
        await Promise.all([
          fetchPair(data._id),
          fetchLeaderboard(dayBeforeYesterdayData._id),
        ]);
      } catch (err) {
        console.warn("Could not fetch yesterday's question:", err);
        setPairError("No question found for yesterday or server error.");
        setLeaderboardError("Cannot load leaderboard without a question.");
      }
    };
    fetchYesterdayData();
  }, []);

  const fetchPair = async (questionId: string) => {
    setLoadingPair(true);
    setPairError("");
    try {
      const data: Answer[] = await backendGet(
        `/question/${questionId}/get_pair`
      );

      if (!Array.isArray(data)) {
        throw new Error(`Expected an array but got: ${JSON.stringify(data)}`);
      }
      if (data.length < 2) {
        setPairAnswers([]);
        setPairError("Not enough answers available to vote on yet.");
      } else {
        setPairAnswers(data);
      }
    } catch (err) {
      console.error("fetchPair error:", err);
      if (axios.isAxiosError(err) && err.response) {
        console.warn("> fetchPair status:", err.response.status);
        console.warn("> fetchPair response body:", err.response.data);
        const msg = (err.response.data as any)?.error;
        setPairError(msg || `Server returned ${err.response.status}`);
      } else {
        setPairError("Could not load a pair of answers.");
      }
    } finally {
      setLoadingPair(false);
    }
  };

  const fetchLeaderboard = async (questionId: string) => {
    setLoadingLeaderboard(true);
    setLeaderboardError("");
    try {
      const data: LeaderboardEntry[] = await backendGet(
        `/question/${questionId}/answer_leaderboard`
      );
      setLeaderboardEntries(data);
    } catch (err) {
      console.error("fetchLeaderboard error:", err);
      if (axios.isAxiosError(err) && err.response) {
        console.warn("> fetchLeaderboard status:", err.response.status);
        console.warn("> fetchLeaderboard response body:", err.response.data);
        const serverMsg = (err.response.data as any)?.error;
        setLeaderboardError(
          serverMsg || `Server returned ${err.response.status}`
        );
      } else {
        setLeaderboardError("Could not load leaderboard.");
      }
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleVote = async (answerId: string) => {
    if (!yesterdayQuestion) return;

    try {
      const resp = await api.post(`/answer/${answerId}/increment-vote`);
      await Promise.all([fetchPair(yesterdayQuestion._id)]);
    } catch (err) {
      console.error("handleVote error:", err);

      if (isAxiosError(err) && err.response) {
        console.warn("> handleVote status:", err.response.status);
        console.warn("> handleVote response body:", err.response.data);
        setPairError(
          typeof err.response.data === "object"
            ? (err.response.data as any).error ||
                `Server ${err.response.status}`
            : `Server ${err.response.status}`
        );
      } else if (isAxiosError(err) && err.request) {
        setPairError("Server did not respond. Please try again later.");
      } else {
        setPairError((err as Error).message);
      }
    }
  };

  const handleSubmitTodayAnswer = async () => {
    if (!todayQuestion) return;
    if (!userId) {
      setTodayError("Still looking up your user ID…");
      return;
    }
    if (todayAnswerText.trim() === "") {
      setTodayError("Answer cannot be empty.");
      return;
    }
    setIsSubmittingTodayAnswer(true);
    setTodayError("");

    try {
      const resp = await api.post("/answer", {
        user_id: userId,
        question_id: todayQuestion._id,
        answer_text: todayAnswerText.trim(),
      });
      setTodayAnswerText("");
      setTodayError("");
      setHasAnsweredToday(true);
    } catch (err) {
      console.error("Error submitting today's answer:", err);
      if (isAxiosError(err) && err.response) {
        if (err.response.status === 409) {
          setTodayError("You already submitted an answer today.");
          setHasAnsweredToday(true);
        } else {
          const serverMsg = (err.response.data as any)?.error;
          setTodayError(serverMsg || `Failed: ${err.response.status}`);
        }
      } else {
        setTodayError("Server is not responding.");
      }
    } finally {
      setIsSubmittingTodayAnswer(false);
    }
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
            <ThemedText style={styles.greeting}>Welcome back</ThemedText>
            <ThemedText style={styles.username}>{username}</ThemedText>
            <View style={styles.headerDivider} />
          </View>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.todayBadge}>
                  <ThemedText style={styles.badgeText}>TODAY</ThemedText>
                </View>
              </View>

              {todayQuestion ? (
                <>
                  <ThemedText style={styles.questionTitle}>
                    {todayQuestion.question}
                  </ThemedText>

                  {hasAnsweredToday ? (
                    <View style={styles.completedContainer}>
                      <View style={styles.checkmark}>
                        <ThemedText style={styles.checkmarkText}>✓</ThemedText>
                      </View>
                      <ThemedText style={styles.completedText}>
                        Answer submitted successfully
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.modernInput}
                        placeholder="Share your thoughts..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={todayAnswerText}
                        onChangeText={setTodayAnswerText}
                        multiline
                      />

                      <TouchableOpacity
                        style={[
                          styles.submitButton,
                          isSubmittingTodayAnswer &&
                            styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmitTodayAnswer}
                        disabled={isSubmittingTodayAnswer}
                      >
                        {isSubmittingTodayAnswer ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <ThemedText style={styles.submitButtonText}>
                              Submit
                            </ThemedText>
                            <ThemedText style={styles.submitArrow}>
                              →
                            </ThemedText>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {todayError && (
                    <View style={styles.errorContainer}>
                      <ThemedText style={styles.errorText}>
                        {todayError}
                      </ThemedText>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.loadingQuestionContainer}>
                  <ActivityIndicator color="#8B5CF6" />
                  <ThemedText style={styles.loadingQuestionText}>
                    Loading today's question...
                  </ThemedText>
                </View>
              )}
            </LinearGradient>
          </BlurView>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(236, 72, 153, 0.1)", "rgba(168, 85, 247, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.yesterdayBadge}>
                  <ThemedText style={styles.badgeText}>VOTE</ThemedText>
                </View>
              </View>

              {yesterdayQuestion ? (
                <>
                  <ThemedText style={styles.questionTitle}>
                    {yesterdayQuestion.question}
                  </ThemedText>

                  {loadingPair ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#EC4899" />
                    </View>
                  ) : pairAnswers.length === 2 ? (
                    <View style={styles.votingContainer}>
                      {pairAnswers.map((ans, idx) => (
                        <TouchableOpacity
                          key={ans._id}
                          style={styles.answerOption}
                          onPress={() => handleVote(ans._id)}
                        >
                          <BlurView intensity={10} style={styles.answerBlur}>
                            <ThemedText style={styles.answerText}>
                              {ans.answer_text}
                            </ThemedText>
                            <View style={styles.voteIndicator}>
                              <ThemedText style={styles.voteText}>
                                Vote {String.fromCharCode(65 + idx)}
                              </ThemedText>
                            </View>
                          </BlurView>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <ThemedText style={styles.noAnswersText}>
                      No answers available for voting yet
                    </ThemedText>
                  )}

                  {pairError && (
                    <ThemedText style={styles.errorText}>
                      {pairError}
                    </ThemedText>
                  )}

                  <TouchableOpacity
                    style={styles.nextPairButton}
                    onPress={() =>
                      yesterdayQuestion && fetchPair(yesterdayQuestion._id)
                    }
                  >
                    <ThemedText style={styles.nextPairText}>
                      Next Pair
                    </ThemedText>
                    <ThemedText style={styles.nextPairArrow}>→</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <ActivityIndicator color="#EC4899" />
              )}
            </LinearGradient>
          </BlurView>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(34, 197, 94, 0.1)", "rgba(16, 185, 129, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.leaderboardBadge}>
                  <ThemedText style={styles.badgeText}>LEADERBOARD</ThemedText>
                </View>
              </View>

              {loadingLeaderboard ? (
                <ActivityIndicator
                  color="#22C55E"
                  style={{ marginVertical: 20 }}
                />
              ) : leaderboardEntries.length ? (
                <View style={styles.leaderboardContainer}>
                  {leaderboardEntries.slice(0, 5).map((item, idx) => (
                    <View key={item.answer._id} style={styles.leaderboardItem}>
                      <View style={styles.rankContainer}>
                        <View
                          style={[
                            styles.rankBadge,
                            idx === 0 && styles.firstPlace,
                            idx === 1 && styles.secondPlace,
                            idx === 2 && styles.thirdPlace,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.rankNumber,
                              idx < 3 && styles.topRankNumber,
                            ]}
                          >
                            {idx + 1}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.leaderboardContent}>
                        <ThemedText
                          style={styles.leaderboardAnswer}
                          numberOfLines={2}
                        >
                          {item.answer.answer_text}
                        </ThemedText>
                        <View style={styles.leaderboardMeta}>
                          <ThemedText style={styles.authorText}>
                            @{item.user.username}
                          </ThemedText>
                          <View style={styles.statsContainer}>
                            <ThemedText style={styles.statsText}>
                              {item.answer.votes ?? 0} ♥{" "}
                              {item.answer.appearances ?? 0} 👁
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText style={styles.noLeaderboardText}>
                  Leaderboard coming soon...
                </ThemedText>
              )}

              {leaderboardError && (
                <ThemedText style={styles.errorText}>
                  {leaderboardError}
                </ThemedText>
              )}
            </LinearGradient>
          </BlurView>

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
  todayBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  yesterdayBadge: {
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.3)",
  },
  leaderboardBadge: {
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
  questionTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 28,
    marginBottom: 24,
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
    minHeight: 80,
    textAlignVertical: "top",
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
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  completedText: {
    color: "#22C55E",
    fontSize: 16,
    fontWeight: "500",
  },
  votingContainer: {
    gap: 16,
    marginBottom: 20,
  },
  answerOption: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  answerBlur: {
    padding: 20,
  },
  answerText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    marginBottom: 12,
  },
  voteIndicator: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  voteText: {
    fontSize: 12,
    color: "#EC4899",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  nextPairButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  nextPairText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
  },
  nextPairArrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  leaderboardContainer: {
    gap: 16,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  rankContainer: {
    minWidth: 40,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  rankNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  topRankNumber: {
    color: "#fff",
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardAnswer: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 22,
    marginBottom: 8,
  },
  leaderboardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statsText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "400",
  },
  loadingQuestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  loadingQuestionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  noAnswersText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
  noLeaderboardText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
});
