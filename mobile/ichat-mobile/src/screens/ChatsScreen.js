// src/screens/ChatsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import ChatItem from '../components/ChatItem';

export default function ChatsScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  async function loadChats() {
    try {
      // ⚠️ Ajuste a rota conforme seu backend
      const response = await axios.get(`${API_URL}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      // Dados de exemplo caso não consiga carregar
      setChats([
        { id: 1, name: 'Cliente - Pedido #123', lastMessage: 'Olá, preciso de ajuda', time: '10:30' },
        { id: 2, name: 'Cliente - Pedido #124', lastMessage: 'Onde está meu pedido?', time: '09:15' },
        { id: 3, name: 'Atendente João', lastMessage: 'Ok, vou verificar', time: 'Ontem' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }

  function handleChatPress(chat) {
    navigation.navigate('Conversation', {
      chatId: chat.id,
      chatName: chat.name,
    });
  }

  if (loading) {
    return (
      <View style={styles. centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item. id.toString()}
        renderItem={({ item }) => (
          <ChatItem chat={item} onPress={() => handleChatPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma conversa ainda</Text>
          </View>
        }
      />
    </View>
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
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});