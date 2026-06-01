import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const ACCENT = "#3DD68C";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [name, setName] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Slide 1 animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeIndex === 0) {
      logoOpacity.setValue(0);
      logoScale.setValue(0.7);
      titleOpacity.setValue(0);
      subtitleOpacity.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
          Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [activeIndex]);

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleNext = async () => {
    if (activeIndex < 3) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      await handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    const trimmed = name.trim();
    if (trimmed) await AsyncStorage.setItem("preferredName", trimmed);
    router.replace({ pathname: "/register", params: trimmed ? { prefillName: trimmed } : {} });
  };

  const SLIDES = [
    {
      id: "1",
      type: "welcome",
    },
    {
      id: "2",
      type: "tools",
      emoji: "🌿",
      title: "Tools that actually help",
      subtitle:
        "Breathing exercises, guided journals, CBT tools, and an AI companion — all in one place.",
    },
    {
      id: "3",
      type: "connected",
      emoji: "🔗",
      title: "Linked to your psychologist",
      subtitle:
        "Your progress is shared securely with your therapist — they're always in the loop.",
    },
    {
      id: "4",
      type: "ready",
    },
  ];

  const renderSlide = ({ item }: { item: typeof SLIDES[number] }) => {
    if (item.type === "welcome") {
      return (
        <View style={[styles.slide, { width, paddingTop: topPad + 60 }]}>
          <Animated.View
            style={[
              styles.logoWrap,
              { transform: [{ scale: logoScale }], opacity: logoOpacity },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🌱</Text>
            </View>
            <Text style={styles.logoText}>HOLA!</Text>
          </Animated.View>
          <Animated.Text
            style={[styles.welcomeTitle, { color: colors.foreground, opacity: titleOpacity }]}
          >
            Your daily mental wellness companion
          </Animated.Text>
          <Animated.Text
            style={[styles.welcomeSubtitle, { color: colors.mutedForeground, opacity: subtitleOpacity }]}
          >
            Track your mood, talk to HOLA Buddy, and grow every day.
          </Animated.Text>
        </View>
      );
    }

    if (item.type === "ready") {
      return (
        <KeyboardAvoidingView
          style={[styles.slide, { width, paddingTop: topPad + 40 }]}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Text style={styles.readyEmoji}>👋</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            What should we call you?
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We'll personalise your experience.
          </Text>
          <TextInput
            style={[
              styles.nameInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Your first name (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </KeyboardAvoidingView>
      );
    }

    return (
      <View style={[styles.slide, { width, paddingTop: topPad + 60 }]}>
        <Text style={styles.slideEmoji}>{item.emoji}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {item.subtitle}
        </Text>
      </View>
    );
  };

  const isLastSlide = activeIndex === 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      {activeIndex < 3 && (
        <TouchableOpacity
          style={[styles.skipBtn, { top: topPad + 16 }]}
          onPress={() => {
            flatListRef.current?.scrollToIndex({ index: 3, animated: true });
          }}
          accessibilityLabel="Skip onboarding"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderSlide}
        scrollEnabled={activeIndex !== 3}
      />

      <View
        style={[
          styles.footer,
          { paddingBottom: bottomPad + 24, backgroundColor: colors.background },
        ]}
      >
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? ACCENT : colors.border,
                  width: index === activeIndex ? 24 : 7,
                },
              ]}
            />
          ))}
        </View>

        {isLastSlide ? (
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: ACCENT }]}
              onPress={handleGetStarted}
              activeOpacity={0.82}
              accessibilityLabel="Create account"
            >
              <Text style={styles.primaryBtnText}>Create account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => router.replace("/login")}
              activeOpacity={0.82}
              accessibilityLabel="Log in to existing account"
            >
              <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                I already have an account
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: ACCENT }]}
            onPress={handleNext}
            activeOpacity={0.82}
            accessibilityLabel="Continue to next slide"
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: "absolute",
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  slide: {
    alignItems: "center",
    paddingHorizontal: 36,
    gap: 16,
  },
  // Slide 1 — welcome
  logoWrap: { alignItems: "center", marginBottom: 8 },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#3DD68C22",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 52 },
  logoText: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: "#3DD68C",
    letterSpacing: -1,
  },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  // Generic slides
  slideEmoji: { fontSize: 80, marginBottom: 4 },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  // Slide 4 — ready
  readyEmoji: { fontSize: 64, marginBottom: 8 },
  nameInput: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    marginTop: 8,
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
    gap: 12,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 4,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 54,
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
