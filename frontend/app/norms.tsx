import { StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";

export default function NormsScreen() {
  const handleAgree = () => {
    router.push("/");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemedText type="title" style={styles.title}>
          Community Guidelines
        </ThemedText>
        <ThemedText style={styles.text}>
        Welcome to The Other Day! This is a simple, fun, and creative platform where you answer the question of 
        the day, vote for the best answers from yesterday, and see where you place on the leaderboard for the 
        other day! We encourage comical answers and lighthearted responses, but you are prohibited from posting 
        the following:</ThemedText>
        <ThemedText>- Bullying </ThemedText>
        <ThemedText>- Sexual content </ThemedText>
        <ThemedText>- Slander </ThemedText>
        <ThemedText>- Baby Boomer Content</ThemedText>
        <ThemedText> </ThemedText>
        <ThemedText>Enjoy the platform, and we cannot wait to see what you come up with!!! 😄 </ThemedText>


        <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
          <ThemedText style={styles.agreeButtonText}>I Agree</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    marginBottom: 30,
    marginTop: 45,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  agreeButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  agreeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
}); 