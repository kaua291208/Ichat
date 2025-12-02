import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert
} from "react-native";

import { io } from "socket.io-client";

const SERVER_URL = "http://192.168.0.191:3000";

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

  // --------------------------------
  function handleConnect() {
    if (!number. trim()) return;
    console.log("Tentando conectar em:", SERVER_URL);

    socketRef. current = io(SERVER_URL, {
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

    // Carrega conversas existentes
    socket.on("conversations:load", (convs) => {
      console.log("📚 Conversas carregadas:", convs);
      setConversations(convs);
    });

    socket.on("conversation:created", (conv) => {
      console.log("✅ Nova conversa:", conv);
      
      // Verifica se a conversa já existe
      setConversations(prev => {
        const exists = prev.find(c => c. id === conv.id);
        if (exists) return prev;
        return [...prev, conv];
      });
      
      setSelectedConversation(conv);
      setMessages([]);
      
      // Carrega o histórico
      socket.emit("conversation:history", {
        conversation_id: conv.id,
      });
    });

    socket.on("conversation:history", (msgs) => {
      console.log("📜 Histórico:", msgs. length);
      setMessages(msgs);
    });

    socket.on("message", (msg) => {
      console.log("📩 Msg:", msg);

      setMessages(prev => {
        // Evita duplicatas
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    socket. on("error", (err) => {
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
    
    // Verifica se já existe conversa com este agente
    const existing = conversations.find(c => c.with === agent.number);
    if (existing) {
      console.log("✅ Conversa já existe, selecionando...");
      setSelectedConversation(existing);
      socketRef.current. emit("conversation:history", {
        conversation_id: existing.id,
      });
      return;
    }

    socketRef. current.emit("conversation:start", {
      with: agent.number
    });
  }

  // --------------------------------
  function sendMessage() {
    if (!text.trim() || !selectedConversation) return;

    socketRef.current.emit("message:send", {
      conversation_id: selectedConversation.id,
      text
    });

    setText("");
  }

  // --------------------------------

  if (!logged) {
    // ===== LOGIN SCREEN =====
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Login - Cliente</Text>

        <TextInput
          placeholder="Seu número"
          value={number}
          onChangeText={setNumber}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleConnect}
        >
          <Text style={styles.btnText}>Conectar</Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 10 }}>
          {connected ? "🟢 Conectado" : "🔴 Desconectado"}
        </Text>
      </SafeAreaView>
    );
  }

  // --------------------------------

  return (
    <SafeAreaView style={styles.container}>
      
      {/* SIDEBAR - CONVERSAS */}
      <View style={styles.sidebar}>
        <Text style={styles.subtitle}>Minhas Conversas</Text>
        <Text style={styles.small}>Logado: {number}</Text>

        {conversations.length === 0 ? (
          <Text style={styles.empty}>Nenhuma conversa</Text>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item. id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chatItem,
                  selectedConversation?. id === item.id && styles. selected
                ]}
                onPress={() => {
                  setSelectedConversation(item);

                  socketRef.current.emit("conversation:history", {
                    conversation_id: item.id
                  });
                }}
              >
                <Text>{item.with}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <Text style={styles.subtitle}>Atendentes</Text>

        {agents.length === 0 ? (
          <Text style={styles.empty}>Nenhum online</Text>
        ) : (
          <FlatList
            data={agents}
            keyExtractor={(item) => item.number}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.agentBtn}
                onPress={() => startConversation(item)}
              >
                <Text style={{ color: "#fff" }}>
                  {item. number}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

      </View>

      {/* CHAT */}
      <View style={styles.chat}>
        {!selectedConversation ? (
          <Text style={styles.emptyChat}>
            Selecione ou inicie uma conversa
          </Text>
        ) : (
          <>
            <Text style={styles.chatTitle}>
              Conversa com {selectedConversation.with}
            </Text>

            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              style={styles.messages}
              ListEmptyComponent={() => (
                <Text style={styles.emptyChat}>
                  Nenhuma mensagem ainda
                </Text>
              )}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.bubble,
                    item.from === number
                      ? styles. ownBubble
                      : styles.otherBubble,
                  ]}
                >
                  <Text style={styles.sender}>
                    {item.from}
                  </Text>

                  <Text style={styles. msg}>
                    {item.text}
                  </Text>
                </View>
              )}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={styles. msgInput}
                value={text}
                placeholder="Digite..."
                onChangeText={setText}
                onSubmitEditing={sendMessage}
              />

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={sendMessage}
              >
                <Text style={{ color: "#fff" }}>
                  Enviar
                </Text>
              </TouchableOpacity>
            </View>

          </>
        )}
      </View>

    </SafeAreaView>
  );
}

// =======================================================

const styles = StyleSheet. create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  title: {
    fontSize: 28,
    marginBottom: 20
  },

  input: {
    borderWidth: 1,
    width: "80%",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10
  },

  btn: {
    marginTop: 10,
    backgroundColor: "#667eea",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 20
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold"
  },

  container: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 140,
    backgroundColor: "#EEE",
    padding: 8
  },

  subtitle: {
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 8
  },

  small: {
    fontSize: 10,
    color: "#666",
    marginBottom: 8
  },

  empty: {
    fontSize: 11,
    color: "#999",
    marginBottom: 8,
    fontStyle: "italic"
  },

  chatItem: {
    padding: 8,
    backgroundColor: "#ddd",
    borderRadius: 6,
    marginBottom: 4
  },

  selected: {
    backgroundColor: "#bbb"
  },

  agentBtn: {
    padding: 8,
    backgroundColor: "#667eea",
    borderRadius: 6,
    marginBottom: 4,
    alignItems: "center"
  },

  chat: {
    flex: 1,
    padding: 10
  },

  emptyChat: {
    marginTop: 100,
    textAlign: "center",
    color: "#999"
  },

  chatTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center"
  },

  messages: {
    flex: 1
  },

  bubble: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: "80%"
  },

  ownBubble: {
    backgroundColor: "#667eea",
    alignSelf: "flex-end"
  },

  otherBubble: {
    backgroundColor: "#ddd",
    alignSelf: "flex-start"
  },

  sender: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333"
  },

  msg: {
    fontSize: 14,
  },

  inputRow: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "center"
  },

  msgInput: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 20,
    marginRight: 6
  },

  sendBtn: {
    backgroundColor: "#667eea",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  }
});