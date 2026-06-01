import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

const FAQS = [
  {
    q: "How do I link my psychologist?",
    a: "Go to Profile → Settings → Psychologist connection. Enter the 6-character code your psychologist gives you.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your journal entries and mood logs are only shared with your psychologist if you consent. Your AI chats are completely private.",
  },
  {
    q: "How does HOLA Buddy work?",
    a: "HOLA Buddy is an AI companion powered by evidence-based CBT and DBT techniques. It's not a replacement for professional therapy.",
  },
  {
    q: "Can I delete my data?",
    a: "Yes. Contact us at support@holalifebuddy.com and we'll delete all your data within 7 days.",
  },
  {
    q: "Why isn't the audio playing?",
    a: "Make sure your phone is not on silent mode. For iOS, check the silent switch on the side of your device.",
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [expanded, setExpanded] = React.useState<number | null>(null);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 100,
      gap: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 4,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    heading: {
      fontSize: 22,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    card: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    faqRow: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    faqRowLast: { padding: 16 },
    faqQ: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
      flex: 1,
    },
    faqA: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 8,
      lineHeight: 20,
    },
    faqHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    contactCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
      gap: 12,
    },
    contactTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    contactBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contactBtnText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    crisisCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.alert + "44",
      backgroundColor: colors.alert + "08",
      padding: 16,
      gap: 8,
    },
    crisisTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.alert,
    },
    crisisText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.heading}>Help & Support</Text>
        </View>

        <Text style={styles.sectionLabel}>Frequently asked questions</Text>
        <View style={styles.card}>
          {FAQS.map((faq, i) => (
            <TouchableOpacity
              key={i}
              style={i < FAQS.length - 1 ? styles.faqRow : styles.faqRowLast}
              onPress={() => setExpanded(expanded === i ? null : i)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQ}>{faq.q}</Text>
                <Feather
                  name={expanded === i ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </View>
              {expanded === i && <Text style={styles.faqA}>{faq.a}</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Contact us</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>We're here to help</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL("mailto:support@holalifebuddy.com")}
            activeOpacity={0.7}
          >
            <Feather name="mail" size={16} color={colors.mutedForeground} />
            <Text style={styles.contactBtnText}>support@holalifebuddy.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.crisisCard}>
          <Text style={styles.crisisTitle}>🆘 In crisis?</Text>
          <Text style={styles.crisisText}>
            If you're in immediate danger or having thoughts of self-harm,
            please contact a crisis line in your country or go to your nearest
            emergency room. HOLA! is not a crisis service.
          </Text>
          <TouchableOpacity
            style={[styles.contactBtn, { borderColor: colors.alert + "44" }]}
            onPress={() => Linking.openURL("tel:1553")}
            activeOpacity={0.7}
          >
            <Feather name="phone" size={16} color={colors.alert} />
            <Text style={[styles.contactBtnText, { color: colors.alert }]}>
              Philippines: 1553 (Crisis Hotline)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
