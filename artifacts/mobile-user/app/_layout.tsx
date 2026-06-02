import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function PushSetup() {
  const { token } = useAuth();
  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  usePushNotifications(token, baseUrl);
  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const seg0 = segments[0] as string | undefined;
    const isPublicRoute =
      seg0 === "onboarding" ||
      seg0 === "login" ||
      seg0 === "register" ||
      seg0 === undefined ||
      seg0 === "index";

    const isProtectedRoute =
      segments[0] === "(tabs)" ||
      segments[0] === "(admin)" ||
      segments[0] === "journal" ||
      segments[0] === "profile" ||
      segments[0] === "settings" ||
      segments[0] === "help" ||
      segments[0] === "client" ||
      segments[0] === "achievements";

    const isAdmin =
      user?.role === "psychologist" || user?.role === "admin";

    if (!token && isProtectedRoute) {
      router.replace("/login");
    } else if (token && isPublicRoute) {
      router.replace(isAdmin ? "/(admin)" : "/(tabs)");
    } else if (token && segments[0] === "(tabs)" && isAdmin) {
      router.replace("/(admin)");
    } else if (token && segments[0] === "(admin)" && !isAdmin) {
      router.replace("/(tabs)");
    }
  }, [token, user, isLoading, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen
        name="client/[id]"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="achievements"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PushSetup />
            <AuthGuard>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </AuthGuard>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
