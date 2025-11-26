// src/screens/ConversationScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL, SOCKET_URL } from '../config';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';

// ID do usuário atual (em produção virá do login)
const CURRENT_USER_ID = 1;

export default function ConversationScreen({ route }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadMessages();
    connectSocket();

    return () => {
      // Desconectar socket ao sair da tela
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function loadMessages() {
    try {
      // ⚠️ Ajuste a rota conforme seu backend
      const response = await axios. get(`${API_URL}/messages/${chatId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      // Mensagens de exemplo
      setMessages([
        { id: 1, text: 'Olá!  Como posso ajudar?', senderId: 2, time: '10:00' },
        { id: 2, text: 'Oi, gostaria de saber sobre meu pedido', senderId: 1, time: '10:01' },
        { id: 3, text: 'Claro! Qual o número do pedido?', senderId: 2, time: '10:02' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function connectSocket() {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current. on('connect', () => {
      console. log('✅ Socket conectado');
      // Entrar na sala do chat
      socketRef.current.emit('join_chat', chatId);
    });

    // Ouvir novas mensagens
    socketRef. current.on('new_message', (message) => {
      console.log('📩 Nova mensagem recebida:', message);
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('disconnect', () => {
      console. log('❌ Socket desconectado');
    });
  }

  function handleSendMessage(text) {
    if (! text.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: text.trim(),
      senderId: CURRENT_USER_ID,
      chatId: chatId,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    // Adicionar mensagem na tela imediatamente
    setMessages((prev) => [...prev, newMessage]);
    scrollToBottom();

    // Enviar via socket
    if (socketRef.current) {
      socketRef.current.emit('send_message', newMessage);
    }

    // OU enviar via HTTP (dependendo do backend)
    // axios.post(`${API_URL}/messages`, newMessage);
  }

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item. id.toString()}
        renderItem={({ item }) => (
          <MessageBubble 
            message={item} 
            isOwn={item.senderId === CURRENT_USER_ID} 
          />
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
      />

      <MessageInput onSend={handleSendMessage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
});