import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import Header from '../components/header';
import SearchBar from '../components/searchbar';
import ChatList from '../components/chatlist';
import Composer from '../components/composer';

const SOCKET_SERVER_URL = "http://10.1.156.80:3000"; // ✅ CORRIGIDO: mesma porta do backend

const MOCK = [
  { id: '1', title: 'Mobile', lastMessage: '', lastAt: Date.now() },
];

export default function AllChats() {
  const [view, setView] = useState('chat'); // ✅ Já abre direto no chat
  const [selected, setSelected] = useState({ id: '1', title: 'Mobile' }); // ✅ Chat fixo com mobile
  const [chats, setChats] = useState(MOCK);
  const [filter, setFilter] = useState('');
  const [composer, setComposer] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, { 
      transports: ['websocket', 'polling'] 
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      console.log('✅ Web socket conectado');
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Web socket desconectado');
    });

    socketRef.current.on('message', (msg) => {
      console.log('📩 Mensagem recebida no web:', msg);
      
      // ✅ Evitar duplicatas
      setMessages(prev => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) {
          console.log('⚠️ Mensagem duplicada ignorada:', msg.id);
          return prev;
        }
        return [...prev, msg];
      });
    });

    return () => {
      if (!socketRef.current) return;
      socketRef.current.off('connect');
      socketRef.current.off('disconnect');
      socketRef.current.off('message');
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = () => {
    if (!composer.trim() || !socketRef.current || !connected) {
      console.warn('⚠️ Não pode enviar: socket não conectado');
      return;
    }

    const payload = { 
      id: Date.now(),
      text: composer.trim(), 
      senderId: 'web',
      senderName: 'Web',
      time: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };

    console.log('📤 Enviando mensagem do web:', payload);

    // ✅ Adiciona localmente
    setMessages(prev => [...prev, payload]);
    setComposer('');

    // ✅ Envia para o servidor
    socketRef.current.emit('message', payload);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
      <Header 
        title={`Chat - ${connected ? '🟢 Conectado' : '🔴 Desconectado'}`} 
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', height: '80vh' }}>
        <div style={{ flex: 1, padding: 12, overflowY: 'auto', backgroundColor: '#f5f5f5' }}>
          {messages.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', marginTop: 100 }}>
              {connected ? 'Nenhuma mensagem ainda.\nEnvie a primeira!' : 'Conectando ao servidor...'}
            </div>
          ) : (
            messages.map(m => (
              <div 
                key={m.id} 
                style={{ 
                  marginBottom: 10, 
                  display: 'flex', 
                  justifyContent: m.senderId === 'web' ? 'flex-end' : 'flex-start' 
                }}
              >
                <div style={{
                  background: m.senderId === 'web' ? '#007AFF' : '#E5E5EA',
                  color: m.senderId === 'web' ? '#fff' : '#000',
                  padding: 10, 
                  borderRadius: 18, 
                  maxWidth: '70%',
                  borderBottomRightRadius: m.senderId === 'web' ? 4 : 18,
                  borderBottomLeftRadius: m.senderId === 'web' ? 18 : 4,
                }}>
                  {m.senderId !== 'web' && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      {m.senderName || 'Mobile'}
                    </div>
                  )}
                  <div style={{ fontSize: 16 }}>{m.text}</div>
                  <div style={{ 
                    fontSize: 11, 
                    marginTop: 6,
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {m.time}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Composer value={composer} onChange={setComposer} onSend={sendMessage} />
      </div>
    </div>
  );
}