import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import {
  Platform, StyleSheet, View, Text, TouchableOpacity,
  Dimensions, FlatList, Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DS } from "@/constants/design";
import { AdminDrawer } from "@/components/AdminDrawer";

const { width } = Dimensions.get("window");
const ADMIN_ONBOARDING_KEY = "adminOnboardingDone_v1";
const ACCENT = "#3DD68C";

const SLIDES = [
  {
    id: "1",
    emoji: "👋",
    accentLine: "Welcome!",
    title: "Your client dashboard is ready",
    subtitle:
      "Monitor mood trends, review risk alerts, message your clients, and track therapeutic goals — all from one place.",
  },
  {
    id: "2",
    emoji: "🔗",
    accentLine: "Step 1",
    title: "Generate a link code",
    subtitle:
      "Tap 'Dashboard' → 'Generate link code' and share the 6-character code with your clients. They enter it in their HOLA! app to connect with you.",
  },
];

function AdminOnboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const advance = () => {
    if (index < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(onDone);
    }
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(s) => s.id}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.slideInner, { width: width - 80 }]}>
              <Text style={styles.slideEmoji}>{item.emoji}</Text>
              <Text style={styles.accentLine}>{item.accentLine}</Text>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSub}>{item.subtitle}</Text>
            </View>
          )}
        />
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? ACCENT : DS.colors.border, width: i === index ? 22 : 7 },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={advance} activeOpacity={0.82}>
          <Text style={styles.nextBtnText}>
            {index === SLIDES.length - 1 ? "Get started →" : "Next →"}
          </Text>
        </TouchableOpacity>
        {index === 0 && (
          <TouchableOpacity onPress={advance} style={{ marginTop: 4 }}>
            <Text style={styles.skipText}>Skip intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

export default function AdminTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const done = await AsyncStorage.getItem(ADMIN_ONBOARDING_KEY);
        if (!done) setShowOnboarding(true);
      } catch {}
      setChecked(true);
    })();
  }, []);

  const handleOnboardingDone = async () => {
    try { await AsyncStorage.setItem(ADMIN_ONBOARDING_KEY, "1"); } catch {}
    setShowOnboarding(false);
  };

  if (!checked) return null;

  const headerLeft = () => (
    <TouchableOpacity
      onPress={() => setDrawerOpen(true)}
      style={styles.headerBtn}
      accessibilityLabel="Open menu"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="menu" size={22} color={DS.colors.dark} />
    </TouchableOpacity>
  );

  const headerRight = () => (
    <TouchableOpacity
      onPress={() => router.navigate("/(admin)/alerts" as any)}
      style={styles.headerBtn}
      accessibilityLabel="View alerts"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="bell" size={22} color={DS.colors.dark} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: DS.colors.dark,
          tabBarInactiveTintColor: DS.colors.muted,
          headerShown: true,
          headerStyle: {
            backgroundColor: DS.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: DS.colors.border,
          } as any,
          headerTintColor: DS.colors.dark,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: DS.fonts.semibold,
            fontSize: 16,
            color: DS.colors.dark,
          },
          headerLeft,
          headerRight,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : DS.colors.background,
            borderTopWidth: 1,
            borderTopColor: DS.colors.border,
            elevation: 0,
            height: isWeb ? 84 : 60,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: DS.colors.background }]} />
            ) : null,
          tabBarLabelStyle: {
            fontFamily: DS.fonts.medium,
            fontSize: 10,
            marginTop: -2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Feather name="grid" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: "Clients",
            tabBarIcon: ({ color }) => (
              <Feather name="users" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color }) => (
              <Feather name="bell" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color }) => (
              <Feather name="message-square" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color }) => (
              <Feather name="bar-chart-2" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarButton: () => null,
            tabBarItemStyle: { display: "none" },
          }}
        />
      </Tabs>

      <AdminDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {showOnboarding && <AdminOnboarding onDone={handleOnboardingDone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 0,
    alignItems: "center",
    gap: 14,
    width: width - 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  slideInner: {
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 10,
  },
  slideEmoji: { fontSize: 56, marginBottom: 4 },
  accentLine: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: ACCENT,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  slideTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    color: "#111",
    lineHeight: 28,
  },
  slideSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    color: "#666",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: { height: 7, borderRadius: 999 },
  nextBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
    marginTop: 4,
    minHeight: 48,
    justifyContent: "center",
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  skipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#999",
  },
});
