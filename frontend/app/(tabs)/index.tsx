<<<<<<< HEAD
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams, router } from "expo-router";
import { backendGet } from "@/backendAPI/backend";
import { api } from "@/backendAPI/backend";
import axios, { AxiosError, isAxiosError } from "axios";

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
  const { username } = useLocalSearchParams<{
    username: string;
  }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [fetchUserError, setFetchUserError] = useState("");
  const [hasAnsweredToday, setHasAnsweredToday] = useState(false);

  //
  // ─── TODAY’S QUESTION STATE ──────────────────────────────────────────────────
  //
  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [todayAnswerText, setTodayAnswerText] = useState("");
  const [isSubmittingTodayAnswer, setIsSubmittingTodayAnswer] = useState(false);
  const [todayError, setTodayError] = useState("");

  //
  // ─── YESTERDAY’S QUESTION + PAIR STATE ───────────────────────────────────────
  //
  const [yesterdayQuestion, setYesterdayQuestion] = useState<Question | null>(
    null
  );
  const [pairAnswers, setPairAnswers] = useState<Answer[]>([]);
  const [loadingPair, setLoadingPair] = useState(false);
  const [pairError, setPairError] = useState("");

  //
  // ─── LEADERBOARD STATE ───────────────────────────────────────────────────────
  //
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");

  // Get userid from username
  useEffect(() => {
    const lookupUserId = async () => {
      try {
        // Calls GET /user/username/<username>
        const data: { user_id: string; username: string } = await backendGet(
          `/user/username/${username}`
        );
        setUserId(data.user_id);
      } catch (err) {
        console.error("Error fetching user by username:", err);
        if (isAxiosError(err) && err.response) {
          setFetchUserError(
            (err.response.data as any)?.error || `Status ${err.response.status}`
          );
        } else {
          setFetchUserError("Could not look up user ID.");
        }
      }
    };
    lookupUserId();
  }, [username]);

  //
  // ─── FETCH TODAY’S QUESTION ON MOUNT ────────────────────────────────────────
  //
  useEffect(() => {
    const fetchToday = async () => {
      try {
        // backendGet(...) returns response.data directly
        const data: Question = await backendGet("/today/get-question/");
        setTodayQuestion(data);
      } catch (err) {
        console.warn("Could not fetch today’s question:", err);
        setTodayError("No question found for today or server error.");
      }
    };
    fetchToday();
  }, []);

  //
  // ─── FETCH YESTERDAY’S QUESTION ON MOUNT ────────────────────────────────────
  //     AND IMMEDIATELY LOAD A PAIR + LEADERBOARD
  //
  useEffect(() => {
    const fetchYesterdayData = async () => {
      try {
        const data: Question = await backendGet("/yesterday/get-question/");
        setYesterdayQuestion(data);

        await Promise.all([fetchPair(data._id), fetchLeaderboard(data._id)]);
      } catch (err) {
        console.warn("Could not fetch yesterday’s question:", err);
        setPairError("No question found for yesterday or server error.");
        setLeaderboardError("Cannot load leaderboard without a question.");
      }
    };
    fetchYesterdayData();
  }, []);

  //
  // ─── HELPER: FETCH A NEW “PAIR” OF ANSWERS FOR A GIVEN QUESTION ID ───────────
  //
  const fetchPair = async (questionId: string) => {
    setLoadingPair(true);
    setPairError("");
    try {
      console.log(`▶️ fetchPair: calling /question/${questionId}/get_pair`);
      const data: Answer[] = await backendGet(
        `/question/${questionId}/get_pair`
      );
      console.log("◀️ fetchPair: response data:", data);

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

  //
  // ─── HELPER: FETCH THE LEADERBOARD FOR A GIVEN QUESTION ID ───────────────────
  //
  const fetchLeaderboard = async (questionId: string) => {
    setLoadingLeaderboard(true);
    setLeaderboardError("");
    try {
      console.log(
        `▶️ fetchLeaderboard: calling /question/${questionId}/answer_leaderboard`
      );
      const data: LeaderboardEntry[] = await backendGet(
        `/question/${questionId}/answer_leaderboard`
      );
      console.log("◀️ fetchLeaderboard: response data:", data);
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

    console.log(`▶️ handleVote: voting for answer ${answerId}`);
    try {
      // 1) Send the POST
      const resp = await api.post(`/answer/${answerId}/increment-vote`);
      console.log(
        "◀️ handleVote: response status",
        resp.status,
        "data:",
        resp.data
      );

      // 2) Refresh pair + leaderboard
      await Promise.all([
        fetchPair(yesterdayQuestion._id),
        fetchLeaderboard(yesterdayQuestion._id),
      ]);
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

  //
  // ─── HANDLER: SUBMIT TODAY’S ANSWER ─────────────────────────────────────────
  //
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
      console.log("/answer success:", resp.status, resp.data);
      setTodayAnswerText("");
      setTodayError("Answer submitted!");

      // Mark locally that they’ve answered:
      setHasAnsweredToday(true);
    } catch (err) {
      console.error("Error submitting today’s answer:", err);
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

  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────
  //
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* ─────────────────────────────────────────────────────────────────────
                Section 1: Greet + Today’s Question
            ───────────────────────────────────────────────────────────────────── */}
        <ThemedText type="title" style={styles.header}>
          Hello, {username}!
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subheader}>
          Today’s Question:
        </ThemedText>
        {todayQuestion ? (
          <ThemedView style={styles.card}>
            <ThemedText style={styles.questionText}>
              {todayQuestion.question}
            </ThemedText>

            {hasAnsweredToday ? (
              <ThemedText style={styles.infoText}>
                You’ve already submitted today’s answer.
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
                  <ThemedText style={styles.errorText}>{todayError}</ThemedText>
                ) : null}
              </>
            )}
          </ThemedView>
        ) : (
          <ActivityIndicator style={{ marginVertical: 20 }} />
        )}

        {/* Spacer */}
        <View style={{ height: 32 }} />

        {/* ─────────────────────────────────────────────────────────────────────
                Section 2: Yesterday’s Question + Voting Pair
            ───────────────────────────────────────────────────────────────────── */}
        <ThemedText type="subtitle" style={styles.subheader}>
          Yesterday’s Question:
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

        {/* Spacer */}
        <View style={{ height: 32 }} />

        {/* ─────────────────────────────────────────────────────────────────────
                Section 3: The Day Before Yesterday's Leaderboard
            ───────────────────────────────────────────────────────────────────── */}
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

        {/* Bottom Padding */}
        <View style={{ height: 60 }} />
      </ScrollView>
=======
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet } from "react-native";

export default function MainTab() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to The Other Day!</ThemedText>
      <ThemedText>Here’s where you’ll answer today’s question.</ThemedText>
>>>>>>> 0f0a080 (tabs and profile page)
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 60,
  },

  // ─── HEADERS ────────────────────────────────────────────────────────────
  header: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 16,
  },
  subheader: {
    fontSize: 20,
    marginBottom: 8,
  },

  // ─── CARDS ──────────────────────────────────────────────────────────────
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

  // ─── TODAY’S QUESTION STYLES ───────────────────────────────────────────
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
    backgroundColor: "#007AFF",
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

  // ─── PAIR ANSWERS STYLES ───────────────────────────────────────────────
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
    backgroundColor: "#34C759",
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
    color: "#007AFF",
    fontSize: 16,
  },

  // ─── LEADERBOARD STYLES ────────────────────────────────────────────────
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

  // ─── ERRORS & LOADING ──────────────────────────────────────────────────
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
=======
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
>>>>>>> 0f0a080 (tabs and profile page)
  },
});
