import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { DS } from "@/constants/design";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";

export default function AdminMessagesScreen() {
  const apiFetch = useAdminFetch();
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const { data: clientsData } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => apiFetch("/v1/psychologist/clients"),
  });
  const clients = clientsData?.clients ?? [];
  const selectedClient = clients.find((c: any) => c.id === selectedClientId);

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["admin-messages", selectedClientId],
    queryFn: () => apiFetch(`/v1/messages?clientId=${selectedClientId}`),
    enabled: !!selectedClientId,
    refetchInterval: 5000,
  });
  const messages = messagesData?.messages ?? [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || !selectedClientId) return;
    setSending(true);
    try {
      await apiFetch("/v1/messages", {
        method: "POST",
        body: JSON.stringify({ recipientId: selectedClientId, content: messageText.trim() }),
      });
      setMessageText("");
      await refetchMessages();
    } catch {
    } finally {
      setSending(false);
    }
  }, [messageText, selectedClientId, apiFetch, refetchMessages]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
      </View>

      <FlatList
        horizontal
        data={clients}
        keyExtractor={(c) => c.id}
        contentContainerStyle={s.chipList}
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={<Text style={s.emptyText}>No clients linked</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.chip, selectedClientId === item.id && s.chipActive]}
            onPress={() => setSelectedClientId(item.id)}
          >
            <Avatar name={item.name} size={26} />
            <Text style={[s.chipName, selectedClientId === item.id && s.chipNameActive]} numberOfLines={1}>
              {item.name.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {!selectedClientId ? (
        <View style={{ flex: 1 }}>
          <EmptyState emoji="💬" title="Select a client" subtitle="Choose a client above to start messaging" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View style={s.chatHeader}>
            <Avatar name={selectedClient?.name ?? "?"} size={32} />
            <Text style={s.chatName}>{selectedClient?.name}</Text>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.msgList}
            ListEmptyComponent={
              <EmptyState emoji="👋" title="No messages yet" subtitle="Say hello to get the conversation started" />
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === user?.id;
              return (
                <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                  <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextThem]}>{item.content}</Text>
                  <Text style={[s.bubbleTime, isMe && { color: "rgba(255,255,255,0.6)" }]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              );
            }}
          />

          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Message..."
              placeholderTextColor={DS.colors.border}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!messageText.trim() || sending) && s.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={DS.colors.white} />
              ) : (
                <Feather name="send" size={18} color={DS.colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  header: { paddingHorizontal: DS.spacing.lg, paddingTop: DS.spacing.md, paddingBottom: DS.spacing.xs },
  title: { fontFamily: DS.fonts.semibold, fontSize: 26, color: DS.colors.dark },
  chipList: { paddingHorizontal: DS.spacing.lg, paddingVertical: DS.spacing.sm, gap: DS.spacing.xs },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: DS.radius.full, borderWidth: 1, borderColor: DS.colors.border, backgroundColor: DS.colors.background },
  chipActive: { backgroundColor: DS.colors.dark, borderColor: DS.colors.dark },
  chipName: { fontFamily: DS.fonts.medium, fontSize: 13, color: DS.colors.dark, maxWidth: 70 },
  chipNameActive: { color: DS.colors.white },
  emptyText: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, paddingVertical: 12 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: DS.spacing.sm, paddingHorizontal: DS.spacing.lg, paddingVertical: DS.spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: DS.colors.border },
  chatName: { fontFamily: DS.fonts.semibold, fontSize: 16, color: DS.colors.dark },
  msgList: { padding: DS.spacing.lg, gap: DS.spacing.xs, flexGrow: 1 },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: DS.spacing.sm, marginBottom: 4 },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: DS.colors.dark, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: "flex-start", backgroundColor: DS.colors.surface, borderWidth: 1, borderColor: DS.colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: DS.fonts.regular, fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: DS.colors.white },
  bubbleTextThem: { color: DS.colors.dark },
  bubbleTime: { fontFamily: DS.fonts.regular, fontSize: 10, color: DS.colors.muted, marginTop: 4, alignSelf: "flex-end" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: DS.spacing.xs, padding: DS.spacing.md, borderTopWidth: 1, borderColor: DS.colors.border, backgroundColor: DS.colors.background },
  input: { flex: 1, borderWidth: 1, borderColor: DS.colors.border, borderRadius: DS.radius.md, paddingHorizontal: DS.spacing.md, paddingVertical: 10, fontFamily: DS.fonts.regular, fontSize: 14, color: DS.colors.dark, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: DS.colors.dark, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
});
