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
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import { backendGet } from "@/backendAPI/backend";
import { api } from "@/backendAPI/backend";
import axios, { AxiosError, isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        // If fewer than 2 answers exist, warn instead of crashing
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

  // HANDLER: VOTE SUBMIT
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
      setTodayError("Answer submitted!");

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
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ThemedText type="title" style={styles.header}>
            Hello, {username}!
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subheader}>
            Today's Question:
          </ThemedText>
          {todayQuestion ? (
            <ThemedView style={styles.card}>
              <ThemedText style={styles.questionText}>
                {todayQuestion.question}
              </ThemedText>

              {hasAnsweredToday ? (
                <ThemedText style={styles.infoText}>
                  You've already submitted today's answer.
                </ThemedText>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Type your answer here…"
                    placeholderTextColor="#666"
                    value={todayAnswerText}
                    onChangeText={setTodayAnswerText}
                  />

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitTodayAnswer}
                    disabled={isSubmittingTodayAnswer}
                  >
                    {isSubmittingTodayAnswer ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ThemedText style={styles.submitButtonText}>
                        Submit Answer
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                  {todayError ? (
                    <ThemedText style={styles.errorText}>
                      {todayError}
                    </ThemedText>
                  ) : null}
                </>
              )}
            </ThemedView>
          ) : (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          )}

          <View style={{ height: 32 }} />

          <ThemedText type="subtitle" style={styles.subheader}>
            Yesterday's Question:
          </ThemedText>
          {yesterdayQuestion ? (
            <ThemedView style={styles.card}>
              <ThemedText style={styles.questionText}>
                {yesterdayQuestion.question}
              </ThemedText>

              {loadingPair ? (
                <ActivityIndicator style={{ marginVertical: 20 }} />
              ) : pairAnswers.length === 2 ? (
                pairAnswers.map((ans, idx) => (
                  <ThemedView key={ans._id} style={styles.answerCard}>
                    <ThemedText style={styles.answerText}>
                      {ans.answer_text}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.voteButton}
                      onPress={() => handleVote(ans._id)}
                    >
                      <ThemedText style={styles.voteButtonText}>
                        Vote for Answer {idx + 1}
                      </ThemedText>
                    </TouchableOpacity>
                  </ThemedView>
                ))
              ) : (
                <ThemedText>No answers available right now.</ThemedText>
              )}

              {pairError ? (
                <ThemedText style={styles.errorText}>{pairError}</ThemedText>
              ) : null}

              <TouchableOpacity
                style={styles.nextPairButton}
                onPress={() =>
                  yesterdayQuestion && fetchPair(yesterdayQuestion._id)
                }
              >
                <ThemedText style={styles.nextPairText}>Next Pair →</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          )}

          <View style={{ height: 32 }} />
          <ThemedText type="subtitle" style={styles.subheader}>
            The Other Day's Leaderboard:
          </ThemedText>
          {loadingLeaderboard ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : leaderboardEntries.length ? (
            leaderboardEntries.map((item, idx) => (
              <ThemedView key={item.answer._id} style={styles.leaderboardCard}>
                <ThemedText style={styles.rankText}>#{idx + 1}</ThemedText>
                <ThemedText style={styles.answerText}>
                  {item.answer.answer_text}
                </ThemedText>
                <ThemedText style={styles.byLine}>
                  — {item.user.username}
                </ThemedText>
                <ThemedText style={styles.ratioText}>
                  Votes: {item.answer.votes ?? 0} Appearances:{" "}
                  {item.answer.appearances ?? 0}
                </ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedText style={styles.noLeaderboardText}>
              No leaderboard entries yet.
            </ThemedText>
          )}

          {leaderboardError ? (
            <ThemedText style={styles.errorText}>{leaderboardError}</ThemedText>
          ) : null}

          <View style={{ height: 60 }} />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },

  header: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 16,
  },
  subheader: {
    fontSize: 20,
    marginBottom: 8,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  leaderboardCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  questionText: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#c0d684",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },

  answerCard: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  answerText: {
    fontSize: 16,
    marginBottom: 8,
  },
  voteButton: {
    backgroundColor: "#63264a",
    height: 40,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  voteButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  nextPairButton: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  nextPairText: {
    color: "#3d0b37",
    fontSize: 16,
  },

  rankText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  byLine: {
    fontSize: 14,
    color: "#555",
    fontStyle: "italic",
    marginBottom: 4,
  },
  ratioText: {
    fontSize: 14,
    color: "#333",
  },
  noLeaderboardText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 12,
  },

  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
