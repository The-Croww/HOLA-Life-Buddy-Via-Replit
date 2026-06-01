import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useRef } from "react";

interface Message {
  id: string;
  senderId: string;
  senderRole: "user" | "psychologist";
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesScreen() {
  const colors = useColors();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [psychName, setPsychName] = useState("Your Psychologist");

  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const markAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${baseUrl}/api/v1/messages/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
    } catch {}
  }, [token, baseUrl]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (data.otherUser?.name) setPsychName(data.otherUser.name);
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMessages();
      markAsRead();
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }, [fetchMessages, markAsRead]),
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id ?? "",
      senderRole: "user",
      recipientId: "",
      content: text,
      read: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`${baseUrl}/api/v1/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error("Send error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: colors.foreground }]}>{psychName}</Text>
            <Text style={[styles.headerSub, { color: colors.calm }]}>Your psychologist</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.calm} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubbleWrap,
                item.senderRole === "user" ? styles.bubbleWrapMe : styles.bubbleWrapThem,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  item.senderRole === "user"
                    ? [styles.bubbleMe, { backgroundColor: colors.foreground }]
                    : [styles.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    {
                      color:
                        item.senderRole === "user" ? colors.background : colors.foreground,
                    },
                  ]}
                >
                  {item.content}
                </Text>
              </View>
              <View style={styles.meta}>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>
                  {formatTime(item.createdAt)}
                </Text>
                {item.senderRole === "user" && (
                  <Text
                    style={[
                      styles.readTick,
                      { color: item.read ? colors.calm : colors.mutedForeground },
                    ]}
                  >
                    {item.read ? "✓✓" : "✓"}
                  </Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center" }}>
                No messages yet.{"\n"}Your psychologist will appear here.
              </Text>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: input.trim() && !sending ? colors.foreground : colors.border,
            },
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Feather
              name="arrow-up"
              size={18}
              color={input.trim() ? colors.background : colors.mutedForeground}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 0.5 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  bubbleWrap: { maxWidth: "80%" },
  bubbleWrapMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleWrapThem: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4, borderWidth: 0.5 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginHorizontal: 4 },
  time: { fontSize: 11, fontFamily: "Inter_400Regular" },
  readTick: { fontSize: 11, fontFamily: "Inter_500Medium" },
  emptyWrap: { alignItems: "center", justifyContent: "center", padding: 40 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    borderWidth: 0.5,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
