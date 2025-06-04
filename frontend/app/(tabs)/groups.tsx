import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { backendGet } from '@/backendAPI/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Group {
  group_name: string;
  group_size: number;
}

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        console.log("Loaded username:", storedUsername);

        if (storedUsername) {
          setUsername(storedUsername);
        } else {
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
    const fetchGroups = async () => {
      if (!username) return;
      
      try {
        const data = await backendGet(`groups/get-groups/${username}`, {});
        console.log(data);
        setGroups(data.groups || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [username]);

  const handleGroupPress = (groupName: string) => {
    console.log(`Pressed group: ${groupName}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors[colorScheme ?? 'light'].text }]}>
          Loading groups...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors[colorScheme ?? 'light'].text }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
        Your Groups
      </Text>
      <ScrollView style={styles.scrollView}>
        {groups.length === 0 ? (
          <Text style={[styles.text, { color: Colors[colorScheme ?? 'light'].text }]}>
            No groups found
          </Text>
        ) : (
          groups.map((group, index) => (
            <TouchableOpacity
              key={`${group.group_name}-${index}`}
              style={[styles.groupButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
              onPress={() => handleGroupPress(group.group_name)}
            >
              <Text style={[styles.groupName, { color: Colors[colorScheme ?? 'light'].text }]}>
                {group.group_name}
              </Text>
              <Text style={[styles.groupSize, { color: Colors[colorScheme ?? 'light'].text }]}>
                {group.group_size} members
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  groupButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  groupSize: {
    fontSize: 14,
    opacity: 0.7,
  },
  text: {
    fontSize: 16,
  },
}); 