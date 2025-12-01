import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  SafeAreaView,
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
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [isInForeground, setIsInForeground] = useState(true);

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

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado! ID:', socketRef.current.id);
      setConnected(true);
    });

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
      });

      scrollToBottom();
    });
  }

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
  }

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  function handleNotificationPress(message) {
    console.log('👆 Usuário clicou na notificação:', message);
    setNotification(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

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
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => {
            if (item && item.id !== undefined && item.id !== null) return String(item.id);
            if (item && item.senderId) return String(item.senderId);
            return String(index);
          }}
          renderItem={({ item }) => {
            const isOwn = String(item.senderId) === String(socketRef.current?.id);
            return <MessageBubble message={item} isOwn={isOwn} />;
          }}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {connected ? 'Nenhuma mensagem ainda.\nEnvie a primeira!' : 'Conectando ao servidor...'}
              </Text>
            </View>
          }
        />

        <MessageInput onSend={handleSendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: '#34c759',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginRight: 8,
  },
  appStateText: {
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});