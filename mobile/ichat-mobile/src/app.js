import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
<<<<<<< Updated upstream
=======
<<<<<<< HEAD
  TextInput
} from "react-native";

import { io } from "socket.io-client";

const SERVER_URL = "http://10.1.157.74:3000";

export default function App() {

  // ===== LOGIN =====
  const [number, setNumber] = useState("");
  const [logged, setLogged] = useState(false);

  // ===== SOCKET =====
=======
>>>>>>> Stashed changes
  AppState,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { io } from 'socket.io-client';
import { APP_NAME, SOCKET_URL, API_URL } from './config';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';
import NotificationBanner from './components/NotificationBanner';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const flatListRef = useRef(null);
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [isInForeground, setIsInForeground] = useState(true);

<<<<<<< HEAD
  // ===== STATUS =====
  const [connected, setConnected] = useState(false);

  // ===== AGENTES =====
  const [agents, setAgents] = useState([]);
=======
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('🔄 Estado do app mudou:', appState.current, '→', nextAppState);
      
      if (nextAppState === 'active') {
        console.log('📱 App em PRIMEIRO PLANO');
        setIsInForeground(true);
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('🌙 App em SEGUNDO PLANO');
        setIsInForeground(false);
      }
      
      appState.current = nextAppState;
    });

    loadHistory();
    connectSocket();

    return () => {
      subscription.remove();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function loadHistory() {
    try {
      console.log('📜 Carregando histórico...');
      const response = await fetch(`${API_URL}/messages`);
      const history = await response.json();
      console.log(`✅ ${history.length} mensagens carregadas`);
      setMessages(history);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    }
  }

  function connectSocket() {
    console.log('🔌 Conectando ao servidor:', SOCKET_URL);
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7

  // ===== CONVERSAS =====
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // ===== MENSAGENS =====
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // --------------------------------
  function handleConnect() {
    if (!number) return;
    console.log("Tentando conectar em:", SERVER_URL)

    socketRef.current = io(SERVER_URL, {
      transports: ["websocket"]
    });

<<<<<<< HEAD
    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Mobile conectado:", socket.id);

=======
    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado! ID:', socketRef.current.id);
<<<<<<< Updated upstream
=======
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
>>>>>>> Stashed changes
      setConnected(true);
      setLogged(true);

<<<<<<< HEAD
      socket.emit("login", {
        number,
        role: "mobile"
=======
    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket desconectado');
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('🔴 Erro de conexão:', error.message);
      setConnected(false);
    });

    socketRef.current.on('message', (message) => {
      console.log('📩 Mensagem recebida:', message);

      const normalized = {
        id: message?.id ?? `${Date.now()}-${Math.random()}`,
        text: message?.text ?? '',
        senderId: message?.senderId ?? message?.sender_id ?? 'unknown',
        senderName: message?.senderName ?? message?.sender_name ?? 'Unknown',
        time: message?.time ?? new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const isOwnMessage = String(normalized.senderId) === String(socketRef.current?.id);
      
      console.log('🔍 Verificando notificação:');
      console.log('  - Mensagem própria?', isOwnMessage);
      console.log('  - App em primeiro plano?', isInForeground);
      console.log('  - Sender ID:', normalized.senderId);
      console.log('  - My Socket ID:', socketRef.current?.id);
      

      if (!isOwnMessage) {
        console.log('🔔 MOSTRANDO NOTIFICAÇÃO!');
        setNotification(normalized);
      } else {
        console.log('⏭️ Ignorando notificação (mensagem própria)');
      }

      setMessages((prev) => {
        const exists = prev.some((msg) => String(msg.id) === String(normalized.id));
        if (exists) {
          console.log('⚠️ Mensagem duplicada ignorada:', normalized.id);
          return prev;
        }
        return [...prev, normalized];
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
      });
    });

    socket.on("agents:list", (list) => {
      console.log("👥 Atendentes:", list);
      setAgents(list);
    });

    socket.on("conversation:created", (conv) => {
      console.log("✅ Nova conversa:", conv);
      setConversations(prev => [...prev, conv]);
      setSelectedConversation(conv);
      setMessages([]);
    });

    socket.on("conversation:history", (msgs) => {
      console.log("📜 Histórico:", msgs.length);
      setMessages(msgs);
    });

    socket.on("message", (msg) => {
      console.log("📩 Msg:", msg);

      if (msg.conversation_id === selectedConversation?.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado");
      setConnected(false);
      setLogged(false);
    });
  }

<<<<<<< HEAD
  // --------------------------------
  function startConversation(agent) {
    socketRef.current.emit("conversation:start", {
      with: agent.number
    });
=======
  function handleSendMessage(text) {
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: text.trim(),
      senderId: socketRef.current?.id ?? 'mobile-temp',
      senderName: 'Mobile',
      time: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    console.log('📤 Enviando mensagem:', newMessage);

    setMessages((prev) => [...prev, newMessage]);
    scrollToBottom();

    if (socketRef.current && connected) {
      socketRef.current.emit('message', newMessage);
    } else {
      console.warn('⚠️ Socket não conectado');
    }
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
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

<<<<<<< Updated upstream
=======
<<<<<<< HEAD
  // --------------------------------

  if (!logged) {
    // ===== LOGIN SCREEN =====
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          placeholder="Seu número"
          value={number}
          onChangeText={setNumber}
          style={styles.input}
          keyboardType="numeric"
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

=======
>>>>>>> Stashed changes
  function handleNotificationPress(message) {
    console.log('👆 Usuário clicou na notificação:', message);
    setNotification(null);
  }

<<<<<<< Updated upstream
=======
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
>>>>>>> Stashed changes
  return (
    <SafeAreaView style={styles.container}>
      
      {/* SIDEBAR - CONVERSAS */}
      <View style={styles.sidebar}>
        <Text style={styles.subtitle}>Conversas</Text>

<<<<<<< HEAD
=======
      <NotificationBanner
        message={notification}
        onPress={handleNotificationPress}
        onDismiss={() => setNotification(null)}
      />

      <NotificationBanner
        message={notification}
        onPress={handleNotificationPress}
        onDismiss={() => setNotification(null)}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{APP_NAME}</Text>
        <View style={[styles.statusIndicator, connected && styles.statusConnected]} />
        <Text style={styles.statusText}>
          {connected ? 'Conectado' : 'Desconectado'}
        </Text>
        <Text style={styles.appStateText}>
          {isInForeground ? '📱' : '🌙'}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chatItem,
                selectedConversation?.id === item.id && styles.selected
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

        <Text style={styles.subtitle}>Atendentes Online</Text>

        <FlatList
          data={agents}
          keyExtractor={(item) => item.number}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.agentBtn}
              onPress={() => startConversation(item)}
            >
              <Text style={{ color: "#fff" }}>
                {item.number}
              </Text>
            </TouchableOpacity>
          )}
        />

      </View>

      {/* CHAT */}
      <View style={styles.chat}>
        {!selectedConversation ? (
          <Text style={styles.empty}>
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
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.bubble,
                    item.from === number
                      ? styles.ownBubble
                      : styles.otherBubble,
                  ]}
                >
                  <Text style={styles.sender}>
                    {item.from}
                  </Text>

                  <Text style={styles.msg}>
                    {item.text}
                  </Text>
                </View>
              )}
            />

            <View style={styles.inputRow}>
              <TextInput
                style={styles.msgInput}
                value={text}
                placeholder="Digite..."
                onChangeText={setText}
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

const styles = StyleSheet.create({
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

  empty: {
    marginTop: 100,
    textAlign: "center"
  },

  chatTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center"
  },
<<<<<<< HEAD

  messages: {
    flex: 1
=======
  statusText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginRight: 8,
<<<<<<< Updated upstream
  },
  appStateText: {
    fontSize: 16,
=======
>>>>>>> Stashed changes
  },
  appStateText: {
    fontSize: 16,
>>>>>>> 265a1b88e8d0626d64db4114a3a91d6c6bb3f8a7
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
