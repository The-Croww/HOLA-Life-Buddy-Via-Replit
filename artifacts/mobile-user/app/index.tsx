import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function Index() {
  const { token, user, isLoading } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}
      >
        <ActivityIndicator color={colors.calm} />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/onboarding" />;
  }

  if (user?.role === "psychologist" || user?.role === "admin") {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(tabs)" />;
}
