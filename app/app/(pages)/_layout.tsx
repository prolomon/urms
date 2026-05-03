import { Tabs } from "expo-router";
import {
  History,
  Home,
  ReceiptText,
  User,
} from "lucide-react-native";
import "react-native-reanimated";

export default function PagesTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0ea360",
        tabBarStyle: {
          paddingTop: 10,
          height: 85,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Home color={color as string} size={size as number} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({ color, size }) => (
            <ReceiptText color={color as string} size={size as number} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <History color={color as string} size={size as number} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Profile",
          tabBarIcon: ({ color, size }) => (
            <User color={color as string} size={size as number} />
          ),
        }}
      />
    </Tabs>
  );
}
