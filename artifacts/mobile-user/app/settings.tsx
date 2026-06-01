import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { useGetMe, useLinkToPsychologist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

const THEME_KEY = "@hola_theme";
const NOTIF_KEY = "@hola_notifications";

type ThemeOption = "system" | "light" | "dark";

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: "monitor" | "sun" | "moon" }[] = [
  { value: "system", label: "Follow system", icon: "monitor" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [theme, setTheme] = useState<ThemeOption>("system");
  const [notifications, setNotifications] = useState(true);
  const [linkCodeInput, setLinkCodeInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const { data: me, refetch: refetchMe } = useGetMe();

  const { mutate: linkToPhysician, isPending: linking } = useLinkToPsychologist({
    mutation: {
      onSuccess: (data) => {
        setLinkError(null);
        setLinkCodeInput("");
        setLinkSuccess(`Connected to ${data.psychologistName}!`);
        refetchMe();
        queryClient.invalidateQueries();
      },
      onError: () => {
        setLinkError("Invalid or expired code. Please check and try again.");
      },
    },
  });

  const linkedPsychName = (me as any)?.linkedPsychologistName as string | null | undefined;
  const isLinked = !!linkedPsychName;

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setTheme(v);
    });
    AsyncStorage.getItem(NOTIF_KEY).then((v) => {
      if (v !== null) setNotifications(v === "true");
    });
  }, []);

  const handleTheme = (val: ThemeOption) => {
    setTheme(val);
    AsyncStorage.setItem(THEME_KEY, val);
  };

  const handleNotifications = (val: boolean) => {
    setNotifications(val);
    AsyncStorage.setItem(NOTIF_KEY, String(val));
  };

  const handleLink = () => {
    const code = linkCodeInput.trim().toUpperCase();
    if (!code) {
      setLinkError("Please enter a code.");
      return;
    }
    setLinkError(null);
    setLinkSuccess(null);
    linkToPhysician({ data: { code } });
  };

  const connectionStatus = isLinked ? "connected" : "not_connected";
  const statusLabel =
    connectionStatus === "connected" ? "Connected" : "Not connected";
  const statusColor =
    connectionStatus === "connected" ? colors.calm : colors.mutedForeground;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Settings
          </Text>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Appearance
          </Text>
          <View
            style={[
              styles.groupCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {THEME_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.row,
                  i < THEME_OPTIONS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleTheme(opt.value)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Feather name={opt.icon} size={17} color={colors.mutedForeground} />
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {opt.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: theme === opt.value ? colors.calm : colors.border,
                      backgroundColor:
                        theme === opt.value ? colors.calm : "transparent",
                    },
                  ]}
                >
                  {theme === opt.value && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: colors.background },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Notifications
          </Text>
          <View
            style={[
              styles.groupCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather name="bell" size={17} color={colors.mutedForeground} />
                <View>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    Push notifications
                  </Text>
                  <Text
                    style={[
                      styles.rowSublabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Daily check-in reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotifications}
                trackColor={{ false: colors.border, true: colors.calm }}
                thumbColor={colors.background}
              />
            </View>
          </View>
        </View>

        {/* Psychologist connection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Psychologist connection
          </Text>

          {/* Status card */}
          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.card,
                borderColor: isLinked ? colors.calm + "55" : colors.border,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.psychIconWrap,
                    {
                      backgroundColor: isLinked
                        ? colors.calm + "22"
                        : colors.secondary,
                    },
                  ]}
                >
                  <Feather
                    name="user-check"
                    size={16}
                    color={isLinked ? colors.calm : colors.mutedForeground}
                  />
                </View>
                <View>
                  <Text
                    style={[styles.rowLabel, { color: colors.foreground }]}
                  >
                    {isLinked ? linkedPsychName! : "No psychologist linked"}
                  </Text>
                  <Text
                    style={[
                      styles.rowSublabel,
                      { color: isLinked ? colors.calm : colors.mutedForeground },
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isLinked ? colors.calm : colors.mutedForeground,
                  },
                ]}
              />
            </View>
          </View>

          {/* Link code entry */}
          <View
            style={[
              styles.groupCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.linkPadding}>
              <Text style={[styles.linkTitle, { color: colors.foreground }]}>
                {isLinked ? "Change psychologist" : "Connect a psychologist"}
              </Text>
              <Text
                style={[styles.linkSub, { color: colors.mutedForeground }]}
              >
                Ask your psychologist for a 6-character link code and enter it
                below.
              </Text>
              <View style={styles.linkRow}>
                <TextInput
                  style={[
                    styles.linkInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: linkError ? colors.alert : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder="ABC123"
                  placeholderTextColor={colors.mutedForeground}
                  value={linkCodeInput}
                  onChangeText={(t) => {
                    setLinkCodeInput(t.toUpperCase());
                    setLinkError(null);
                    setLinkSuccess(null);
                  }}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[
                    styles.linkBtn,
                    {
                      backgroundColor: colors.foreground,
                      opacity: linking ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleLink}
                  activeOpacity={0.8}
                  disabled={linking}
                >
                  {linking ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text
                      style={[
                        styles.linkBtnText,
                        { color: colors.background },
                      ]}
                    >
                      Connect
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {linkError && (
                <Text style={[styles.feedbackText, { color: colors.alert }]}>
                  {linkError}
                </Text>
              )}
              {linkSuccess && (
                <Text style={[styles.feedbackText, { color: colors.calm }]}>
                  {linkSuccess}
                </Text>
              )}
            </View>
          </View>

          {/* Go to messages shortcut */}
          {isLinked && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push("/(tabs)/messages")}
              activeOpacity={0.8}
            >
              <Feather name="message-square" size={16} color={colors.foreground} />
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>
                Open messages
              </Text>
              <Feather
                name="chevron-right"
                size={16}
                color={colors.mutedForeground}
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            Privacy & data
          </Text>
          <View
            style={[
              styles.groupCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.row,
                { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Feather
                  name="shield"
                  size={17}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Privacy policy
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.row} activeOpacity={0.7}>
              <View style={styles.rowLeft}>
                <Feather
                  name="help-circle"
                  size={17}
                  color={colors.mutedForeground}
                />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Help & support
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={[styles.version, { color: colors.mutedForeground }]}
        >
          HOLA! Life Buddy v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
    marginLeft: 2,
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  rowSublabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  psychIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linkPadding: { padding: 16, gap: 10 },
  linkTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  linkSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  linkRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  linkInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  linkBtn: {
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
  },
  linkBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  feedbackText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingBottom: 4,
  },
});
