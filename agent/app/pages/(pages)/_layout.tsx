import { Tabs } from "expo-router";
import {
  Home,
  ScanBarcode,
  User,
  UserPlus,
  Users,
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
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => (
            <ScanBarcode color={color as string} size={size as number} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Member",
          tabBarIcon: ({ color, size }) => (
            <UserPlus color={color as string} size={size as number} />
          ),
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: "Members",
          tabBarIcon: ({ color, size }) => (
            <Users color={color as string} size={size as number} />
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
