import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import IndexScreen from "../(tabs)/index";
import ProfileScreen from "../(tabs)/profile";

const Tab = createBottomTabNavigator();

export default function LoggedInLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = "information-circle";
          if (route.name === "Main") {
            iconName = "home";
          } else if (route.name === "Profile") {
            iconName = "person-outline";
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Main"
        component={IndexScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <ThemedText>{focused ? "Home" : "Home"}</ThemedText>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <ThemedText>{focused ? "Profile" : "Profile"}</ThemedText>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
