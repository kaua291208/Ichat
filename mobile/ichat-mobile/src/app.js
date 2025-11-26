// App.js
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
import { APP_NAME, SOCKET_URL } from './src/config';
import MessageBubble from './src/components/MessageBubble';
import MessageInput from './src/components/MessageInput';

// ID do usuário mobile (sempre será 'mobile')
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
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado!');
      setConnected(true);
      
      // Entrar na sala do chat
      socketRef.current.emit('join_chat', 'main_chat');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket desconectado');
      setConnected(false);
    });

    socketRef. current.on('connect_error', (error) => {
      console.error('🔴 Erro de conexão:', error. message);
      setConnected(false);
    });

    // Ouvir mensagens do web
    socketRef.current.on('new_message', (message) => {
      console.log('📩 Mensagem recebida:', message);
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });
  }

  function handleSendMessage(text) {
    if (! text.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: text.trim(),
      senderId: USER_ID,
      senderName: 'Mobile',
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    // Adicionar na tela imediatamente
    setMessages((prev) => [...prev, newMessage]);
    scrollToBottom();

    // Enviar para o web via socket
    if (socketRef.current && connected) {
      socketRef. current.emit('send_message', newMessage);
      console.log('📤 Mensagem enviada:', newMessage);
    } else {
      console.warn('⚠️ Socket não conectado, mensagem não foi enviada');
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  return (
    <SafeAreaView style={styles. container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{APP_NAME}</Text>
        <View style={[styles.statusIndicator, connected && styles.statusConnected]} />
        <Text style={styles.statusText}>
          {connected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>

      {/* Área de mensagens */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform. OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ?  90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item. id.toString()}
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