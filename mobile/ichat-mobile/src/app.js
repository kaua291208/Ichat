import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert,
  StatusBar
} from "react-native";

import { io } from "socket.io-client";

const SERVER_URL = "http://192.168.0.101:3000";

export default function App() {

  // ===== LOGIN =====
  const [number, setNumber] = useState("");
  const [logged, setLogged] = useState(false);

  // ===== SOCKET =====
  const socketRef = useRef(null);

  // ===== STATUS =====
  const [connected, setConnected] = useState(false);

  // ===== AGENTES =====
  const [agents, setAgents] = useState([]);

  // ===== CONVERSAS =====
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // ===== MENSAGENS =====
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // ✅ SCROLL AUTOMÁTICO
  const flatListRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // --------------------------------
  function handleConnect() {
    if (!number.trim()) return;
    console.log("Tentando conectar em:", SERVER_URL);

    socketRef.current = io(SERVER_URL, {
      transports: ["websocket"]
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Mobile conectado:", socket.id);

      setConnected(true);
      setLogged(true);

      socket.emit("login", {
        number,
        role: "mobile"
      });
    });

    socket.on("agents:list", (list) => {
      console.log("👥 Atendentes:", list);
      setAgents(list);
    });

    socket.on("conversations:load", (convs) => {
      console.log("📚 Conversas carregadas:", convs);
      setConversations(convs);
    });

    socket.on("conversation:created", (conv) => {
      console.log("✅ Nova conversa criada:", conv);
      
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev;
        return [...prev, conv];
      });
      
      setSelectedConversation(conv);
      setMessages([]);
      
      socket.emit("conversation:history", {
        conversation_id: conv.id,
      });
    });

    socket.on("conversation:history", (msgs) => {
      console.log("📜 Histórico:", msgs.length);
      setMessages(msgs);
    });

    socket.on("message", (msg) => {
      console.log("📩 Msg recebida:", msg);

      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    // ✅ LISTENER PARA CONFIRMAR ENVIO
    socket.on("message:sent", (msg) => {
      console.log("✅ Mensagem enviada:", msg);
      
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    socket.on("error", (err) => {
      console.error("❌ Erro:", err);
      Alert.alert("Erro", err.message);
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado");
      setConnected(false);
      setLogged(false);
    });
  }

  // --------------------------------
  function startConversation(agent) {
    console.log("🔄 Iniciando conversa com:", agent.number);
    
    const existing = conversations.find(c => c.with === agent.number);
    if (existing) {
      console.log("✅ Conversa já existe, selecionando...");
      setSelectedConversation(existing);
      setMessages([]);
      socketRef.current.emit("conversation:history", {
        conversation_id: existing.id,
      });
      return;
    }

    socketRef.current.emit("conversation:start", {
      with: agent.number
    });
  }

  // --------------------------------
  function sendMessage() {
    if (!text.trim() || !selectedConversation) return;

    console.log("📤 Enviando:", text);

    socketRef.current.emit("message:send", {
      conversation_id: selectedConversation.id,
      text
    });

    setText("");
  }

  // --------------------------------

  if (!logged) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a3a2e" />
        
        <View style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>iChat</Text>
            <Text style={styles.loginSubtitle}>Cliente Mobile</Text>
          </View>

          <TextInput
            placeholder="Digite seu número"
            placeholderTextColor="#88a399"
            value={number}
            onChangeText={setNumber}
            style={styles.loginInput}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>CONECTAR</Text>
          </TouchableOpacity>

          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, connected && styles.statusDotConnected]} />
            <Text style={styles.statusText}>
              {connected ? "Conectado" : "Desconectado"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a3a2e" />
      
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        {/* HEADER */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Conversas</Text>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>{number}</Text>
          </View>
        </View>

        {/* CONVERSAS */}
        <View style={styles.section}>
          {conversations.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma conversa</Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.conversationItem,
                    selectedConversation?.id === item.id && styles.conversationItemActive
                  ]}
                  onPress={() => {
                    console.log("📂 Abrindo conversa:", item.id);
                    setSelectedConversation(item);
                    setMessages([]);
                    socketRef.current.emit("conversation:history", {
                      conversation_id: item.id
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.conversationAvatar}>
                    <Text style={styles.conversationAvatarText}>
                      {item.with.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.conversationName}>{item.with}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* ATENDENTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atendentes Online</Text>
          
          {agents.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum disponível</Text>
          ) : (
            <FlatList
              data={agents}
              keyExtractor={(item) => item.number}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.agentBtn}
                  onPress={() => startConversation(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.agentDot} />
                  <Text style={styles.agentBtnText}>{item.number}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>

      {/* CHAT AREA */}
      <View style={styles.chatArea}>
        {!selectedConversation ? (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatIcon}>💬</Text>
            <Text style={styles.emptyChatTitle}>Nenhuma conversa selecionada</Text>
            <Text style={styles.emptyChatSubtitle}>
              Selecione uma conversa ou inicie um novo atendimento
            </Text>
          </View>
        ) : (
          <>
            {/* CHAT HEADER */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderAvatar}>
                <Text style={styles.chatHeaderAvatarText}>
                  {selectedConversation.with.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.chatHeaderName}>
                  {selectedConversation.with}
                </Text>
                <Text style={styles.chatHeaderStatus}>Online</Text>
              </View>
            </View>

            {/* MESSAGES */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={() => (
                <View style={styles.emptyMessagesContainer}>
                  <Text style={styles.emptyMessagesText}>
                    Nenhuma mensagem ainda
                  </Text>
                  <Text style={styles.emptyMessagesSubtext}>
                    Envie uma mensagem para iniciar
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageBubble,
                    item.from === number ? styles.ownMessage : styles.otherMessage,
                  ]}
                >
                  <Text style={styles.messageSender}>{item.from}</Text>
                  <Text
                    style={[
                      styles.messageText,
                      item.from === number ? styles.ownMessageText : styles.otherMessageText
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              )}
            />

            {/* INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                value={text}
                placeholder="Digite sua mensagem..."
                placeholderTextColor="#88a399"
                onChangeText={setText}
                onSubmitEditing={sendMessage}
                multiline
                maxLength={500}
              />

              <TouchableOpacity
                style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!text.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>▶</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
// =======================================================
// STYLES
// =======================================================

const styles = StyleSheet.create({
  // ===== LOGIN =====
  loginContainer: {
    flex: 1,
    backgroundColor: "#1a3a2e",
    justifyContent: "center",
    alignItems: "center",
  },

  loginCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  loginHeader: {
    alignItems: "center",
    marginBottom: 30,
  },

  loginTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1a3a2e",
    marginBottom: 5,
  },

  loginSubtitle: {
    fontSize: 14,
    color: "#4a7c59",
    letterSpacing: 1,
  },

  loginInput: {
    backgroundColor: "#f0f5f3",
    borderWidth: 2,
    borderColor: "#d4e3db",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#1a3a2e",
    marginBottom: 20,
  },

  loginBtn: {
    backgroundColor: "#2d5f43",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2d5f43",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e74c3c",
    marginRight: 8,
  },

  statusDotConnected: {
    backgroundColor: "#27ae60",
  },

  statusText: {
    fontSize: 13,
    color: "#666",
  },

  // ===== MAIN CONTAINER =====
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f0f5f3",
  },

  // ===== SIDEBAR =====
  sidebar: {
    width: 180,
    backgroundColor: "#1a3a2e",
    paddingTop: 10,
  },

  sidebarHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#2d5f43",
  },

  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },

  userBadge: {
    backgroundColor: "#2d5f43",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  userBadgeText: {
    color: "#a8d5ba",
    fontSize: 11,
    fontWeight: "600",
  },

  section: {
    flex: 1,
    padding: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#a8d5ba",
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  emptyText: {
    fontSize: 11,
    color: "#6b8f7a",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },

  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#2d5f43",
    borderRadius: 10,
    marginBottom: 8,
  },

  conversationItemActive: {
    backgroundColor: "#4a7c59",
  },

  conversationAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#a8d5ba",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  conversationAvatarText: {
    color: "#1a3a2e",
    fontSize: 16,
    fontWeight: "bold",
  },

  conversationName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#2d5f43",
    marginVertical: 10,
  },

  agentBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#2d5f43",
    borderRadius: 8,
    marginBottom: 6,
  },

  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#27ae60",
    marginRight: 8,
  },

  agentBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },

  // ===== CHAT AREA =====
  chatArea: {
    flex: 1,
    backgroundColor: "#f0f5f3",
  },

  emptyChatContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },

  emptyChatIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.3,
  },

  emptyChatTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a3a2e",
    marginBottom: 8,
  },

  emptyChatSubtitle: {
    fontSize: 14,
    color: "#6b8f7a",
    textAlign: "center",
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#d4e3db",
  },

  chatHeaderAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#2d5f43",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  chatHeaderAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  chatHeaderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a3a2e",
  },

  chatHeaderStatus: {
    fontSize: 12,
    color: "#27ae60",
    marginTop: 2,
  },

  messagesList: {
    flex: 1,
    backgroundColor: "#f0f5f3",
  },

  messagesContent: {
    padding: 15,
  },

  emptyMessagesContainer: {
    alignItems: "center",
    marginTop: 50,
  },

  emptyMessagesText: {
    fontSize: 15,
    color: "#6b8f7a",
    marginBottom: 5,
  },

  emptyMessagesSubtext: {
    fontSize: 13,
    color: "#88a399",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },

  ownMessage: {
    backgroundColor: "#2d5f43",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },

  otherMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#d4e3db",
  },

  messageSender: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.7,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },

  ownMessageText: {
    color: "#fff",
  },

  otherMessageText: {
    color: "#1a3a2e",
  },

  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#d4e3db",
    alignItems: "flex-end",
  },

  messageInput: {
    flex: 1,
    backgroundColor: "#f0f5f3",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1a3a2e",
    maxHeight: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#d4e3db",
  },

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2d5f43",
    justifyContent: "center",
    alignItems: "center",
  },

  sendBtnDisabled: {
    backgroundColor: "#88a399",
    opacity: 0.5,
  },

  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});