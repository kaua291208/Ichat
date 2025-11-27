import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');

  function handleSend() {
    if (text.trim()) { // ✅ CORRIGIDO
      onSend(text);
      setText('');
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite uma mensagem..."
        placeholderTextColor="#999"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
      />

      <TouchableOpacity
        style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} // ✅ CORRIGIDO
        onPress={handleSend}
        disabled={!text.trim()} // ✅ CORRIGIDO
        activeOpacity={0.7}
      >
        <Ionicons
          name="send"
          size={22}
          color={text.trim() ? '#007AFF' : '#ccc'} // ✅ CORRIGIDO
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

