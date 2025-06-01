import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { StyleSheet } from "react-native";

export default function MainTab() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome to The Other Day!</ThemedText>
      <ThemedText>Here’s where you’ll answer today’s question.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
