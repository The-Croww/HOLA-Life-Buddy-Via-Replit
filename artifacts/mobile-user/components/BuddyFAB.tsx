import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
} from "react-native";

const BUDDY_FACE = require("../assets/buddy-face.jpg");
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "I'm feeling anxious 😰",
  "I need to vent",
  "Guide me through breathing",
  "I'm feeling low today",
  "Celebrate a small win 🎉",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey there 👋 I'm HOLA Buddy, your personal wellness companion. How are you feeling right now? You can talk to me about anything — I'm here to listen and support you.",
  timestamp: new Date(),
};

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(450 - i * 150),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={[chatStyles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={chatStyles.typingDots}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              chatStyles.dot,
              {
                backgroundColor: colors.mutedForeground,
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function BuddyChat({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      try {
        const history = [...messages, userMsg]
          .filter((m) => !(m.id === "welcome" && m.role === "assistant"))
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch(
          `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messages: history }),
          }
        );

        const data = await res.json() as any;
        if (!res.ok) throw new Error(data.error ?? "API error");

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              data.message?.content ??
              data.choices?.[0]?.message?.content ??
              "I'm here with you. Could you tell me more?",
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "Sorry, I had trouble connecting. Please check your internet and try again 💙",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, isTyping, token]
  );

  const showQuickReplies =
    !isTyping &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages.length <= 2;

  return (
    <KeyboardAvoidingView
      style={[chatStyles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          chatStyles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={chatStyles.headerRow}>
          <Image source={BUDDY_FACE} style={chatStyles.avatarImage} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={[chatStyles.headerName, { color: colors.foreground }]}>
              HOLA Buddy
            </Text>
            <View style={chatStyles.onlineRow}>
              <View style={[chatStyles.onlineDot, { backgroundColor: "#3DD68C" }]} />
              <Text style={[chatStyles.headerStatus, { color: "#3DD68C" }]}>
                Always here for you
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[chatStyles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Feather name="x" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        style={chatStyles.messageList}
        contentContainerStyle={chatStyles.messageListContent}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        renderItem={({ item }) => (
          <View
            style={[
              chatStyles.bubbleWrapper,
              item.role === "user"
                ? chatStyles.bubbleWrapperUser
                : chatStyles.bubbleWrapperAssistant,
            ]}
          >
            <View
              style={[
                chatStyles.bubble,
                item.role === "user"
                  ? [chatStyles.bubbleUser, { backgroundColor: colors.foreground }]
                  : [chatStyles.bubbleAssistant, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}
            >
              <Text
                style={[
                  chatStyles.bubbleText,
                  { color: item.role === "user" ? colors.background : colors.foreground },
                ]}
              >
                {item.content}
              </Text>
            </View>
            <Text style={[chatStyles.timestamp, { color: colors.mutedForeground }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={{ marginTop: 4, alignSelf: "flex-start" }}>
              <TypingIndicator colors={colors} />
            </View>
          ) : null
        }
      />

      {/* Quick replies */}
      {showQuickReplies && (
        <View style={[chatStyles.quickRepliesContainer, { borderTopColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={chatStyles.quickRepliesScroll}
          >
            {QUICK_REPLIES.map((qr) => (
              <TouchableOpacity
                key={qr}
                style={[chatStyles.quickReply, { borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => sendMessage(qr)}
                activeOpacity={0.7}
              >
                <Text style={[chatStyles.quickReplyText, { color: colors.foreground }]}>{qr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View
        style={[
          chatStyles.inputRow,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        <TextInput
          style={[
            chatStyles.textInput,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
          ]}
          placeholder="Talk to HOLA Buddy..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            chatStyles.sendBtn,
            { backgroundColor: input.trim() && !isTyping ? colors.foreground : colors.border },
          ]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          activeOpacity={0.8}
        >
          {isTyping ? (
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

interface BuddyFABProps {
  bottomOffset?: number;
}

export function BuddyFAB({ bottomOffset = 80 }: BuddyFABProps) {
  const [open, setOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => setOpen(true));
  };

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <BuddyChat onClose={() => setOpen(false)} />
      </Modal>

      <Animated.View
        style={[
          fabStyles.fab,
          { bottom: bottomOffset, transform: [{ scale }] },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={fabStyles.fabTouch}
        >
          <Image source={BUDDY_FACE} style={fabStyles.fabImage} resizeMode="cover" />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
    overflow: "hidden",
  },
  fabTouch: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
  },
  fabImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
});

const chatStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  headerStatus: { fontSize: 12, fontFamily: "Inter_400Regular" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
  },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  bubbleWrapper: { maxWidth: "80%" },
  bubbleWrapperUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleWrapperAssistant: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderBottomLeftRadius: 4, borderWidth: 0.5 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  timestamp: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, marginHorizontal: 4 },
  typingBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 0.5,
  },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  quickRepliesContainer: { paddingVertical: 10, borderTopWidth: 0.5 },
  quickRepliesScroll: { paddingHorizontal: 16, gap: 8 },
  quickReply: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 0.5 },
  quickReplyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  textInput: {
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
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
