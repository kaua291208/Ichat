import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://192.168.0.101:3000";

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
    if (!number.trim()) return;

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
      const filtered = list.filter(a => a.number !== number);
      setAgents(filtered);
    });

    socket.on("conversations:load", (convs) => {
      console.log("📚 Conversas carregadas:", convs);
      setConversations(convs);
    });

    socket.on("conversation:created", (conv) => {
      console.log("✅ Nova conversa:", conv);
      
      setConversations((prev) => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev;
        return [...prev, conv];
      });
      
      setSelectedConversation(conv);
      setMessages([]);
      
      socket.emit("conversation:history", {
        conversation_id: conv.id,
      });
    });

    socket.on("conversation:history", (msgs) => {
      console.log("📜 Histórico:", msgs);
      setMessages(msgs);
    });

    socket.on("message", (msg) => {
      console.log("📩 Recebendo:", msg);

      setMessages((prev) => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    socket.on("message:sent", (msg) => {
      console.log("✅ Mensagem enviada:", msg);
      
      setMessages(prev => {
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
    console.log("🔄 Iniciando conversa com:", agent.number);
    
    const existing = conversations.find(c => c.with === agent.number);
    if (existing) {
      console.log("✅ Conversa já existe, selecionando...");
      setSelectedConversation(existing);
      setMessages([]);
      socketRef.current.emit("conversation:history", {
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

    console.log("📤 Enviando:", text);

    socketRef.current.emit("message:send", {
      conversation_id: selectedConversation.id,
      text,
    });

    setText("");
  };

  // ======================================================

  if (!logged) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <h1 style={styles.loginTitle}>iChat</h1>
            <p style={styles.loginSubtitle}>Atendente Web</p>
          </div>

          <input
            placeholder="Digite seu número"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            style={styles.loginInput}
          />

          <button onClick={handleConnect} style={styles.loginBtn}>
            CONECTAR
          </button>

          <div style={styles.statusContainer}>
            <div style={{
              ...styles.statusDot,
              backgroundColor: connected ? "#27ae60" : "#e74c3c"
            }} />
            <span style={styles.statusText}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h3 style={styles.sidebarTitle}>Conversas</h3>
          <div style={styles.userBadge}>
            <span style={styles.userBadgeText}>{number}</span>
          </div>
        </div>

        {/* CONVERSAS */}
        <div style={styles.section}>
          {conversations.length === 0 ? (
            <p style={styles.emptyText}>Nenhuma conversa</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  ...styles.conversationItem,
                  backgroundColor: selectedConversation?.id === conv.id 
                    ? "#4a7c59" 
                    : "#2d5f43"
                }}
                onClick={() => {
                  console.log("📂 Abrindo conversa:", conv.id);
                  setSelectedConversation(conv);
                  setMessages([]);
                  socketRef.current.emit("conversation:history", {
                    conversation_id: conv.id,
                  });
                }}
              >
                <div style={styles.conversationAvatar}>
                  {conv.with.charAt(0).toUpperCase()}
                </div>
                <span style={styles.conversationName}>{conv.with}</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.divider} />

        {/* ATENDENTES */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Atendentes Online</h4>
          
          {agents.length === 0 ? (
            <p style={styles.emptyText}>Nenhum disponível</p>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.number}
                style={styles.agentBtn}
                onClick={() => startConversation(agent)}
              >
                <div style={styles.agentDot} />
                {agent.number}
              </button>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={styles.chatArea}>
        {!selectedConversation ? (
          <div style={styles.emptyChatContainer}>
            <div style={styles.emptyChatIcon}>💬</div>
            <h2 style={styles.emptyChatTitle}>Nenhuma conversa selecionada</h2>
            <p style={styles.emptyChatSubtitle}>
              Selecione uma conversa ou inicie um novo atendimento
            </p>
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderAvatar}>
                {selectedConversation.with.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={styles.chatHeaderName}>
                  {selectedConversation.with}
                </h2>
                <span style={styles.chatHeaderStatus}>Online</span>
              </div>
            </div>

            {/* MESSAGES */}
            <div style={styles.messages}>
              {messages.length === 0 ? (
                <div style={styles.emptyMessagesContainer}>
                  <p style={styles.emptyMessagesText}>Nenhuma mensagem ainda</p>
                  <p style={styles.emptyMessagesSubtext}>Envie uma mensagem para iniciar</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.messageBubble,
                      alignSelf: msg.from === number ? "flex-end" : "flex-start",
                      backgroundColor: msg.from === number ? "#2d5f43" : "#fff",
                      borderBottomRightRadius: msg.from === number ? "4px" : "16px",
                      borderBottomLeftRadius: msg.from === number ? "16px" : "4px",
                      border: msg.from === number ? "none" : "1px solid #d4e3db"
                    }}
                  >
                    <small style={{
                      ...styles.messageSender,
                      color: msg.from === number ? "#a8d5ba" : "#6b8f7a"
                    }}>
                      {msg.from}
                    </small>
                    <div style={{
                      ...styles.messageText,
                      color: msg.from === number ? "#fff" : "#1a3a2e"
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            {/* INPUT */}
            <div style={styles.inputRow}>
              <input
                style={styles.messageInput}
                value={text}
                placeholder="Digite sua mensagem..."
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button 
                onClick={sendMessage} 
                style={{
                  ...styles.sendBtn,
                  opacity: text.trim() ? 1 : 0.5,
                  cursor: text.trim() ? "pointer" : "not-allowed"
                }}
                disabled={!text.trim()}
              >
                ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
  // ===== LOGIN =====
  loginContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#1a3a2e",
    fontFamily: "Arial, sans-serif"
  },

  loginCard: {
    width: "400px",
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
  },

  loginHeader: {
    textAlign: "center",
    marginBottom: "30px"
  },

  loginTitle: {
    fontSize: "42px",
    fontWeight: "bold",
    color: "#1a3a2e",
    margin: "0 0 10px 0"
  },

  loginSubtitle: {
    fontSize: "14px",
    color: "#4a7c59",
    letterSpacing: "1px",
    margin: 0
  },

  loginInput: {
    width: "100%",
    padding: "15px",
    fontSize: "16px",
    border: "2px solid #d4e3db",
    borderRadius: "12px",
    backgroundColor: "#f0f5f3",
    color: "#1a3a2e",
    outline: "none",
    marginBottom: "20px",
    boxSizing: "border-box"
  },

  loginBtn: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "bold",
    letterSpacing: "1.5px",
    backgroundColor: "#2d5f43",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(45, 95, 67, 0.3)",
    transition: "all 0.3s"
  },

  statusContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "20px",
    gap: "8px"
  },

  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%"
  },

  statusText: {
    fontSize: "13px",
    color: "#666"
  },

  // ===== MAIN CONTAINER =====
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f0f5f3"
  },

  // ===== SIDEBAR =====
  sidebar: {
    width: "280px",
    backgroundColor: "#1a3a2e",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto"
  },

  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid #2d5f43"
  },

  sidebarTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
    margin: "0 0 10px 0"
  },

  userBadge: {
    backgroundColor: "#2d5f43",
    padding: "6px 12px",
    borderRadius: "12px",
    display: "inline-block"
  },

  userBadgeText: {
    color: "#a8d5ba",
    fontSize: "12px",
    fontWeight: "600"
  },

  section: {
    padding: "15px"
  },

  sectionTitle: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#a8d5ba",
    marginBottom: "12px",
    letterSpacing: "0.5px"
  },

  emptyText: {
    fontSize: "12px",
    color: "#6b8f7a",
    fontStyle: "italic",
    textAlign: "center",
    margin: "10px 0"
  },

  conversationItem: {
    display: "flex",
    alignItems: "center",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "10px",
    cursor: "pointer",
    transition: "all 0.2s"
  },

  conversationAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#a8d5ba",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1a3a2e",
    marginRight: "12px"
  },

  conversationName: {
    color: "#fff",
    fontSize: "14px",
    fontWeight: "500"
  },

  divider: {
    height: "1px",
    backgroundColor: "#2d5f43",
    margin: "10px 15px"
  },

  agentBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    backgroundColor: "#2d5f43",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    transition: "all 0.2s"
  },

  agentDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#27ae60"
  },

  // ===== CHAT AREA =====
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f0f5f3"
  },

  emptyChatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px"
  },

  emptyChatIcon: {
    fontSize: "64px",
    marginBottom: "20px",
    opacity: 0.3
  },

  emptyChatTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1a3a2e",
    margin: "0 0 10px 0"
  },

  emptyChatSubtitle: {
    fontSize: "14px",
    color: "#6b8f7a",
    textAlign: "center",
    margin: 0
  },

  chatHeader: {
    display: "flex",
    alignItems: "center",
    padding: "20px",
    backgroundColor: "#fff",
    borderBottom: "1px solid #d4e3db"
  },

  chatHeaderAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#2d5f43",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "22px",
    fontWeight: "bold",
    color: "#fff",
    marginRight: "15px"
  },

  chatHeaderName: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1a3a2e",
    margin: "0 0 4px 0"
  },

  chatHeaderStatus: {
    fontSize: "13px",
    color: "#27ae60"
  },

  messages: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    overflowY: "auto",
    backgroundColor: "#f0f5f3"
  },

  emptyMessagesContainer: {
    textAlign: "center",
    marginTop: "50px"
  },

  emptyMessagesText: {
    fontSize: "15px",
    color: "#6b8f7a",
    margin: "0 0 5px 0"
  },

  emptyMessagesSubtext: {
    fontSize: "13px",
    color: "#88a399",
    margin: 0
  },

  messageBubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "16px",
    marginBottom: "12px"
  },

  messageSender: {
    fontSize: "11px",
    fontWeight: "600",
    display: "block",
    marginBottom: "5px",
    opacity: 0.7
  },

  messageText: {
    fontSize: "15px",
    lineHeight: "1.4"
  },

  inputRow: {
    display: "flex",
    gap: "12px",
    padding: "15px",
    backgroundColor: "#fff",
    borderTop: "1px solid #d4e3db"
  },

  messageInput: {
    flex: 1,
    padding: "12px 18px",
    fontSize: "15px",
    border: "1px solid #d4e3db",
    borderRadius: "20px",
    backgroundColor: "#f0f5f3",
    color: "#1a3a2e",
    outline: "none"
  },

  sendBtn: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#2d5f43",
    color: "#fff",
    border: "none",
    fontSize: "20px",
    fontWeight: "bold",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.2s"
  }
};