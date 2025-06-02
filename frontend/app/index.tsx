import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./login";

export default function EntryPoint() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem("user_id");
      setLoggedIn(!!userId);
      setChecking(false);
    };

    checkLoginStatus();
  }, []);

  if (checking) {
    return null;
  }

  if (loggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <LoginScreen />;
}
