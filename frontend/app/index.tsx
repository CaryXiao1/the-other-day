import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./login";

export default function EntryPoint() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

<<<<<<< HEAD
  const handleLogin = async () => {
    try {
      const response = await auth('/user/login', {
        username: username,
        password: password,
      });

      router.push({
        pathname: '/home',
        params: {username: username }
      });
    } catch (error) {
      console.error('Login error:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError('Invalid username or password');
      } else if (axiosError.request) {
        // The request was made but no response was received
        setError('Server is not responding. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An unexpected error occurred. Please try again.');
      }
      setShowError(true);
    }
  };
=======
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userId = await AsyncStorage.getItem("user_id");
      setLoggedIn(!!userId);
      setChecking(false);
    };
>>>>>>> 0f0a080 (tabs and profile page)

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
