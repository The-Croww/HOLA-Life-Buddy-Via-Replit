import React, { useState, useEffect, useRef } from "react";
import { Send, User } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../App";

interface Client {
  id: string;
  name: string;
  email: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  senderRole: "user" | "psychologist";
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export function Messaging() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedRef = useRef<string | null>(null);

  selectedRef.current = selected;

  const baseUrl = ``;

  const fetchClients = () => {
    fetch(`${baseUrl}/api/v1/messages/clients`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clients) {
          setClients(data.clients);
          if (data.clients.length > 0 && !selectedRef.current) {
            setSelected(data.clients[0].id);
          }
        }
      })
      .catch(console.error);
  };

  const fetchMessages = (clientId: string) => {
    setLoading(true);
    fetch(`${baseUrl}/api/v1/messages?clientId=${clientId}`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // Initial load
  useEffect(() => {
    fetchClients();
  }, [user?.token]);

  // Fetch messages when client is selected
  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected);
  }, [selected, user?.token]);

  // Socket.io for real-time messages
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(window.location.origin, {
      path: "/api/socket.io",
      query: { psychologistId: user.id },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("new_message", (msg: Message) => {
      // If the message is in the currently selected thread, add it
      if (
        selectedRef.current &&
        (msg.senderId === selectedRef.current || msg.recipientId === selectedRef.current)
      ) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Refresh client list to update unread counts + last message
      fetchClients();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, baseUrl]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !selected) return;
    const text = input.trim();
    setInput("");

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id ?? "",
      senderRole: "psychologist",
      recipientId: selected,
      content: text,
      read: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`${baseUrl}/api/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ content: text, recipientId: selected }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? data.message : m)),
        );
        fetchClients();
      }
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const selectedClient = clients.find((c) => c.id === selected);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 280,
          borderRight: "2px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg2)",
        }}
      >
        <div
          style={{
            padding: "20px 16px 14px",
            borderBottom: "2px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Conversations
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {clients.length === 0 && (
            <div
              style={{
                padding: 24,
                color: "var(--muted)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              No linked clients yet
            </div>
          )}
          {clients.map((c) => {
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  background: active ? "var(--bg)" : "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                  transition: "background 0.12s",
                  boxShadow: active ? "inset 0 0 0 1px var(--accent-border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: active ? "var(--accent)" : "var(--bg2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? "#fff" : "var(--muted)",
                    flexShrink: 0,
                  }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--fg)",
                      marginBottom: 2,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.lastMessage ?? "No messages yet"}
                  </div>
                </div>
                {c.unread > 0 && (
                  <div
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      background: "var(--alert)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 6px",
                    }}
                  >
                    {c.unread}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selectedClient ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 12,
              color: "var(--muted)",
            }}
          >
            <User size={36} strokeWidth={1.5} />
            <div style={{ fontSize: 14 }}>Select a client to start messaging</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: "14px 24px",
                borderBottom: "2px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--bg)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {selectedClient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--fg)" }}>
                  {selectedClient.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {selectedClient.unread > 0
                    ? `${selectedClient.unread} unread`
                    : "All caught up"}
                </div>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#22c55e",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
                Live
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: "20px 24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                background: "var(--bg2)",
              }}
            >
              {messages.length === 0 && !loading && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: 14,
                    marginTop: 40,
                  }}
                >
                  No messages yet. Say hello.
                </div>
              )}
              {messages.map((m) => {
                const mine = m.senderRole === "psychologist";
                return (
                  <React.Fragment key={m.id}>
                    <div
                      style={{
                        maxWidth: "65%",
                        alignSelf: mine ? "flex-end" : "flex-start",
                        padding: "10px 14px",
                        borderRadius: 16,
                        borderBottomRightRadius: mine ? 4 : 16,
                        borderBottomLeftRadius: mine ? 16 : 4,
                        background: mine ? "#0a0a0a" : "#fff",
                        color: mine ? "#fff" : "var(--fg)",
                        fontSize: 14,
                        lineHeight: "1.5",
                        border: mine ? "none" : "1px solid var(--border)",
                      }}
                    >
                      {m.content}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        alignSelf: mine ? "flex-end" : "flex-start",
                        marginBottom: 6,
                        paddingInline: 4,
                      }}
                    >
                      {formatTime(m.createdAt)}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "2px solid var(--border)",
                display: "flex",
                gap: 10,
                background: "var(--bg)",
              }}
            >
              <input
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  background: "var(--bg2)",
                  color: "var(--fg)",
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Message ${selectedClient.name}…`}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  background: input.trim() ? "#0a0a0a" : "var(--border)",
                  color: input.trim() ? "#fff" : "var(--muted)",
                  border: "none",
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
