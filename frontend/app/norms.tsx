import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  View,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function NormsScreen() {
  const handleAgree = () => {
    router.push("/");
  };

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
            <ThemedText style={styles.greeting}>Welcome to</ThemedText>
            <ThemedText style={styles.title}>The Other Day</ThemedText>
            <View style={styles.headerDivider} />
          </View>

          <BlurView intensity={20} style={styles.glassCard}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.guidelinesBadge}>
                  <ThemedText style={styles.badgeText}>GUIDELINES</ThemedText>
                </View>
              </View>

              <ThemedText style={styles.introText}>
                This is a simple, fun, and creative platform where you answer
                the question of the day, vote for the best answers from
                yesterday, and see where you place on the leaderboard for the
                other day! We encourage comical answers and lighthearted
                responses, but you are prohibited from posting the following:
              </ThemedText>

              <View style={styles.rulesContainer}>
                <View style={styles.ruleItem}>
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.ruleText}>Bullying</ThemedText>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.ruleText}>
                    Sexual content
                  </ThemedText>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.ruleText}>Slander</ThemedText>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.bulletPoint} />
                  <ThemedText style={styles.ruleText}>
                    Baby Boomer Content
                  </ThemedText>
                </View>
              </View>

              <View style={styles.enjoyContainer}>
                <ThemedText style={styles.enjoyText}>
                  Enjoy the platform, and we cannot wait to see what you come up
                  with! 😄
                </ThemedText>
              </View>
            </LinearGradient>
          </BlurView>

          <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.8)", "rgba(99, 102, 241, 0.8)"]}
              style={styles.agreeButtonGradient}
            >
              <ThemedText style={styles.agreeButtonText}>I Agree</ThemedText>
              <ThemedText style={styles.agreeArrow}>→</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

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
  title: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "700",
    marginTop: 5,
    letterSpacing: -0.5,
    lineHeight: 35,
    textAlign: "center",
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
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 20,
  },
  guidelinesBadge: {
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
  introText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
    marginBottom: 24,
  },
  rulesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
  },
  ruleText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  enjoyContainer: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  enjoyText: {
    fontSize: 16,
    color: "#22C55E",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },
  agreeButton: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  agreeButtonGradient: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  agreeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  agreeArrow: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
  },
});
