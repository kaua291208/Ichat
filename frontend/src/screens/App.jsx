import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://192.168.0.191:3000";

export default function App() {
  // LOGIN
  const [number, setNumber] = useState("");
  const [logged, setLogged] = useState(false);

  // SOCKET
  const socketRef = useRef(null);

  // STATUS
  const [connected, setConnected] = useState(false);

  // LISTA DE ATENDENTES
  const [agents, setAgents] = useState([]);

  // CONVERSAS
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // CHAT
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const endRef = useRef(null);

  // SCROLL
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ========= LOGIN ==========
  const handleConnect = () => {
    if (! number. trim()) return;

    socketRef.current = io(SERVER_URL, {
      transports: ["websocket"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ conectado:", socket.id);
      setConnected(true);

      socket.emit("login", {
        number,
        role: "web",
      });

      setLogged(true);
    });

    socket.on("agents:list", (list) => {
      console.log("👥 Atendentes:", list);
      // Remove o próprio usuário da lista de atendentes
      const filtered = list.filter(a => a.number !== number);
      setAgents(filtered);
    });

    // Carrega conversas existentes
    socket.on("conversations:load", (convs) => {
      console.log("📚 Conversas carregadas:", convs);
      setConversations(convs);
    });

    socket.on("conversation:created", (conv) => {
      console.log("✅ Nova conversa:", conv);
      
      // Verifica se a conversa já existe
      setConversations((prev) => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) {
          return prev;
        }
        return [...prev, conv];
      });
      
      setSelectedConversation(conv);
      setMessages([]);
      
      // Carrega o histórico da conversa
      socket.emit("conversation:history", {
        conversation_id: conv. id,
      });
    });

    socket. on("conversation:history", (msgs) => {
      console.log("📜 Histórico:", msgs);
      setMessages(msgs);
    });

    socket. on("message", (msg) => {
      console.log("📩 Recebendo:", msg);

      setMessages((prev) => {
        // Evita duplicatas
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    socket.on("error", (err) => {
      console.error("❌ Erro:", err);
      alert(err.message);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setLogged(false);
    });
  };

  // ========= CRIAR CONVERSA =========
  const startConversation = (agent) => {
    console.log("🔄 Iniciando conversa com:", agent. number);
    
    // Verifica se já existe conversa com este agente
    const existing = conversations.find(c => c.with === agent.number);
    if (existing) {
      console.log("✅ Conversa já existe, selecionando.. .");
      setSelectedConversation(existing);
      socketRef.current. emit("conversation:history", {
        conversation_id: existing.id,
      });
      return;
    }

    socketRef.current.emit("conversation:start", {
      with: agent.number,
    });
  };

  // ========= ENVIAR =========
  const sendMessage = () => {
    if (!text.trim() || !selectedConversation) return;

    socketRef.current.emit("message:send", {
      conversation_id: selectedConversation.id,
      text,
    });

    setText("");
  };

  // ======================================================

  if (!logged) {
    // TELA DE LOGIN
    return (
      <div style={styles.center}>
        <h1>Login - Atendente</h1>

        <input
          placeholder="Seu número / ID"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          style={styles.input}
        />

        <button onClick={handleConnect} style={styles. button}>
          Conectar
        </button>

        <p>{connected ? "🟢 Conectado" : "🔴 Desconectado"}</p>
      </div>
    );
  }

  // ======================================================

  return (
    <div style={styles.container}>
      {/* LISTA DE CONVERSAS */}
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h3>Conversas</h3>
          <small>Logado: {number}</small>
        </div>

        {conversations.length === 0 ? (
          <p style={{ padding: 10, fontSize: 12, color: "#666" }}>
            Nenhuma conversa ainda
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              style={{
                ...styles.chatItem,
                background:
                  selectedConversation?.id === conv. id ? "#bbb" : "#f5f5f5",
              }}
              onClick={() => {
                setSelectedConversation(conv);
                socketRef.current.emit("conversation:history", {
                  conversation_id: conv.id,
                });
              }}
            >
              {conv.with}
            </div>
          ))
        )}

        <hr />

        <h4>Atendentes Online</h4>

        {agents.length === 0 ? (
          <p style={{ padding: 10, fontSize: 12, color: "#666" }}>
            Nenhum atendente online
          </p>
        ) : (
          agents.map((agent) => (
            <button
              key={agent.number}
              style={styles.agentBtn}
              onClick={() => startConversation(agent)}
            >
              {agent.number}
            </button>
          ))
        )}
      </div>

      {/* CHAT */}
      <div style={styles.chat}>
        {! selectedConversation ? (
          <p style={{ textAlign: "center", marginTop: 50 }}>
            Selecione ou inicie uma conversa
          </p>
        ) : (
          <>
            <h2>Conversa com {selectedConversation.with}</h2>

            <div style={styles.messages}>
              {messages.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666" }}>
                  Nenhuma mensagem ainda
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg. id}
                    style={{
                      alignSelf: msg.from === number ? "flex-end" : "flex-start",
                      background: msg.from === number ? "#667eea" : "#fff",
                      color: msg. from === number ? "#fff" : "#333",
                      padding: 10,
                      margin: 5,
                      borderRadius: 10,
                      maxWidth: "70%",
                    }}
                  >
                    <small>{msg.from}</small>
                    <div>{msg.text}</div>
                  </div>
                ))
              )}

              <div ref={endRef} />
            </div>

            <div style={styles.inputRow}>
              <input
                style={styles.input}
                value={text}
                placeholder="Digite..."
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage} style={styles. button}>
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ======================================================

const styles = {
  center: {
    textAlign: "center",
    marginTop: "150px",
  },
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial",
  },
  sidebar: {
    width: "250px",
    background: "#eee",
    padding: 10,
    overflowY: "auto",
  },
  header: {
    marginBottom: 10,
  },
  chatItem: {
    padding: 10,
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 6,
  },
  agentBtn: {
    width: "100%",
    padding: 8,
    margin: "4px 0",
    cursor: "pointer",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: 6,
  },
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: 10,
  },
  messages: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    background: "#f0f0f0",
    borderRadius: 8,
    padding: 10,
  },
  inputRow: {
    display: "flex",
    marginTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    cursor: "pointer",
  },
};