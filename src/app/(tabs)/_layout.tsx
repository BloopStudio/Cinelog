import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/js-tabs";

import { AppTabButton } from "@/components/AppTabButton";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E63946",
        tabBarInactiveTintColor: "#9AA5B1",
        tabBarButton: (props) => <AppTabButton {...props} />,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        sceneStyle: { backgroundColor: "#0B0F14" },
        tabBarStyle: {
          backgroundColor: "#151B23",
          borderTopColor: "#2A323D",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 66,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ma liste",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "film" : "film-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Recherche",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "À découvrir",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Bilan",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
