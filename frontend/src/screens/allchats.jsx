import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import Header from '../components/header';
import SearchBar from '../components/searchbar';
import ChatList from '../components/chatlist';
import Composer from '../components/composer';

const SOCKET_SERVER_URL = "http://localhost:3001"; // ajuste se necessário


const MOCK = [
  { id: '1', title: 'Fulano', lastMessage: 'Oi, tudo bem?', lastAt: Date.now() - 1000 * 60 * 60 },
  { id: '2', title: 'Projeto', lastMessage: 'Atualizei o PR', lastAt: Date.now() - 1000 * 60 * 40 },
];

export default function AllChats() {
  const [view, setView] = useState('list'); 
  const [selected, setSelected] = useState(null);
  const [chats, setChats] = useState(MOCK);
  const [filter, setFilter] = useState('');
  const [composer, setComposer] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const selectedRef = useRef(selected);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => {
    // conecta uma vez
    socketRef.current = io(SOCKET_SERVER_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      setConnected(true);
      console.log('socket connected');
      // opcional: pedir lista de chats/histórico ao backend
      // socketRef.current.emit('getChats');
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
      console.log('socket disconnected');
    });

    // recebe mensagens vindas do servidor
    socketRef.current.on('message', (msg) => {
      if (!msg) return;
      // atualiza preview de chats
      setChats(prev => {
        const exists = prev.find(c => c.id === msg.chatId);
        if (exists) {
          return prev.map(c => c.id === msg.chatId ? { ...c, lastMessage: msg.text, lastAt: msg.at } : c);
        }
        // cria novo chat se necessário
        return [{ id: msg.chatId, title: msg.title || 'Contato', lastMessage: msg.text, lastAt: msg.at }, ...prev];
      });

      // se a conversa selecionada for a mesma, adiciona a mensagem à tela
      if (selectedRef.current && msg.chatId === selectedRef.current.id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    // cleanup
    return () => {
      if (!socketRef.current) return;
      socketRef.current.off('connect');
      socketRef.current.off('disconnect');
      socketRef.current.off('message');
      socketRef.current.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ao abrir chat, limpa mensagens e (opcional) solicita histórico ao backend
  const openChat = (chat) => {
    setSelected(chat);
    setView('chat');
    setMessages([]); // remove mensagens de exemplo
    // solicitar histórico (se o backend fornecer)
    // socketRef.current?.emit('getHistory', { chatId: chat.id });
  };

  const sendMessage = () => {
    if (!composer.trim() || !socketRef.current || !selected) return;
    const payload = { chatId: selected.id, text: composer.trim(), at: Date.now() };

    // optimistic UI: adiciona localmente
    setMessages(prev => [...prev, { ...payload, id: 'local-' + Date.now(), from: 'me' }]);
    setChats(prev => prev.map(c => c.id === selected.id ? { ...c, lastMessage: payload.text, lastAt: payload.at } : c));
    setComposer('');

    // envia para o servidor (o servidor deve re-broadcast com evento 'message')
    socketRef.current.emit('message', payload);
  };

  const filtered = chats.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()) || (c.lastMessage || '').toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
      <Header title={view === 'list' ? `Chats ${connected ? '•' : ' (offline)'} ` : selected?.title} onBack={view === 'chat' ? () => setView('list') : null} />
      {view === 'list' ? (
        <>
          <SearchBar value={filter} onChange={setFilter} />
          <ChatList chats={filtered} onSelect={openChat} />
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
          <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
            {messages.length === 0 ? <div style={{ color: '#666' }}>Sem mensagens</div> :
              messages.map(m => (
                <div key={m.id} style={{ marginBottom: 10, display: 'flex', justifyContent: (m.from === 'me') ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: (m.from === 'me') ? '#daf1d8' : '#fff',
                    padding: 8, borderRadius: 8, maxWidth: '70%', boxShadow: '0 0 0 1px #f0f0f0 inset'
                  }}>
                    <div style={{ fontSize: 14 }}>{m.text}</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{new Date(m.at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            }
          </div>
          <Composer value={composer} onChange={setComposer} onSend={sendMessage} />
        </div>
      )}
    </div>
  );
}