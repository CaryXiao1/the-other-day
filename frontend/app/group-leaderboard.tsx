import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { backendGet } from '@/backendAPI/backend';
import { Ionicons } from '@expo/vector-icons';

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
  const [answerLeaderboard, setAnswerLeaderboard] = useState<AnswerLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yesterdayQuestion, setYesterdayQuestion] = useState<{ _id: string; question: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch group leaderboard
        const leaderboardData = await backendGet(`groups/leaderboard/${groupName}`, {});
        setLeaderboard(leaderboardData.leaderboard || []);

        // Fetch the day before yesterday's question
        const otherDayData = await backendGet('/day-before-yesterday/get-question/', {});
        setYesterdayQuestion(otherDayData);

        // Fetch answer leaderboard for the day before yesterday's question
        if (otherDayData && otherDayData._id) {
          const answerData = await backendGet(`/groups/${groupName}/answer-leaderboard/${otherDayData._id}`, {});
          setAnswerLeaderboard(answerData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupName]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading leaderboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.header}>
            {groupName} Overall Points
          </ThemedText>
        </View>
        <ScrollView style={styles.scrollView}>
          {leaderboard.length === 0 ? (
            <ThemedText style={styles.noDataText}>No members found</ThemedText>
          ) : (
            leaderboard.map((entry) => (
              <ThemedView key={entry._id} style={styles.leaderboardCard}>
                <ThemedText style={styles.rankText}>#{entry.rank}</ThemedText>
                <ThemedText style={styles.usernameText}>{entry.username}</ThemedText>
                <ThemedText style={styles.pointsText}>{entry.total_points} points</ThemedText>
              </ThemedView>
            ))
          )}

          {/* The Other Day's Question Leaderboard */}
          {yesterdayQuestion && (
            <>
              <View style={styles.divider} />
              <ThemedText type="title" style={styles.header}>
                The Other Day's Question
              </ThemedText>
              <ThemedText style={styles.questionText}>
                {yesterdayQuestion.question}
              </ThemedText>
              {answerLeaderboard.length === 0 ? (
                <ThemedText style={styles.noDataText}>No answers found</ThemedText>
              ) : (
                answerLeaderboard.map((entry, index) => (
                  <ThemedView key={entry.answer._id} style={styles.leaderboardCard}>
                    <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
                    <ThemedText style={styles.answerText}>{entry.answer.answer_text}</ThemedText>
                    <ThemedText style={styles.usernameText}>— {entry.user.username}</ThemedText>
                    <ThemedText style={styles.pointsText}>
                      Votes: {entry.answer.votes} | Appearances: {entry.answer.appearances}
                    </ThemedText>
                  </ThemedView>
                ))
              )}
            </>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 16,
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 14,
    color: '#666',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  answerText: {
    fontSize: 16,
    marginBottom: 8,
  },
}); 