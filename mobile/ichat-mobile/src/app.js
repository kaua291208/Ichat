import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { io } from 'socket.io-client';
import { APP_NAME, SOCKET_URL } from './config';
import MessageBubble from './components/MessageBubble';
import MessageInput from './components/MessageInput';

const USER_ID = 'mobile';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  function connectSocket() {
    console.log('🔌 Conectando ao servidor:', SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado!');
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
      
      // ✅ Evitar duplicatas: só adiciona se NÃO for do próprio usuário
      // ou se não existir no array
      setMessages((prev) => {
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log('⚠️ Mensagem duplicada ignorada:', message.id);
          return prev;
        }
        return [...prev, message];
      });
      
      scrollToBottom();
    });
  }

  function handleSendMessage(text) {
    if (!text.trim()) return;

    const newMessage = {
      id: Date.now(), // Timestamp único
      text: text.trim(),
      senderId: USER_ID,
      senderName: 'Mobile',
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    // ✅ Adicionar mensagem localmente
    setMessages((prev) => [...prev, newMessage]);
    scrollToBottom();

    // ✅ Enviar para o servidor
    if (socketRef.current && connected) {
      socketRef.current.emit('message', newMessage);
      console.log('📤 Mensagem enviada:', newMessage);
    } else {
      console.warn('⚠️ Socket não conectado');
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{APP_NAME}</Text>
        <View style={[styles.statusIndicator, connected && styles.statusConnected]} />
        <Text style={styles.statusText}>
          {connected ? 'Conectado' : 'Desconectado'}
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
          keyExtractor={(item) => item.id.toString()} // ✅ Chave única
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isOwn={item.senderId === USER_ID} 
            />
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {connected 
                  ? 'Nenhuma mensagem ainda.\nEnvie a primeira!' 
                  : 'Conectando ao servidor...'}
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