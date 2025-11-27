
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const App = () => {
  const [mensagems, setMensagems] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mySocketId, setMySocketId] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://10.1.156.206:3000";


    socketRef.current = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    const socket = socketRef.current;

    async function loadHistory() {
      try {
        console.log("📜 Carregando histórico...");
        const response = await fetch(`${SERVER_URL}/api/messages`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const history = await response.json();

        const normalized = history
          .map((msg) => ({
            id: msg.id,
            text: msg.text,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            socketId: msg.socket_id ?? msg.socketId ?? null,
            time:
              msg.time ||
              (msg.created_at
                ? new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })),
            createdAt: msg.created_at ?? msg.createdAt ?? null,
          }))

          .sort((a, b) => {
            if (a.createdAt && b.createdAt) return new Date(a.createdAt) - new Date(b.createdAt);
            return 0;
          });

        console.log(`✅ ${normalized.length} mensagens carregadas`);
        setMensagems(normalized);
      } catch (error) {
        console.error("❌ Erro ao carregar histórico:", error);
      }
    }


    loadHistory();

    socket.on("connect", () => {
      console.log("✅ Conectado ao servidor:", socket.id);
      setConectado(true);
      setMySocketId(socket.id);
    });

    socket.on("message", (data) => {
      console.log("📩 Mensagem recebida:", data);


      setMensagems((prev) => {
        const exists = prev.some((msg) => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado");
      setConectado(false);
      setMySocketId(null);
    });


    return () => {
      socket.off("connect");
      socket.off("message");
      socket.off("disconnect");
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagems]);

  const sendMensage = () => {
    if (mensagem.trim().length === 0) return;
    const socket = socketRef.current;
    const now = new Date();
    const newMessage = {
      id: `${Date.now()}-${socket?.id ?? "local"}`,
      text: mensagem.trim(),
      sender: "Web",
      senderId: socket?.id ?? mySocketId,
      senderName: "Web",
      socketId: socket?.id ?? mySocketId,
      time: now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: now.toISOString(),
    };

    console.log("📤 Enviando:", newMessage);


    setMensagems((prev) => [...prev, newMessage]);


    if (socket && socket.connected) {
      socket.emit("message", newMessage);
    } else {
      console.warn("Socket não conectado — mensagem não enviada ao servidor.");
    }

    setMensagem("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMensage();
  };

  return (
    <div style={styles.appContainer}>
      <h1 style={styles.title}>💬 Chat em Tempo Real</h1>

      <div
        style={{
          ...styles.statusBox,
          ...(conectado ? styles.statusConnected : styles.statusDisconnected),
        }}
      >
        {conectado ? "🟢 Conectado" : "🔴 Desconectado"}
      </div>

      {/* Área de mensagens */}
      <div style={styles.messagesArea}>
        {mensagems.length === 0 ? (
          <p style={styles.emptyText}>Nenhuma mensagem ainda... Seja o primeiro! 🚀</p>
        ) : (
          mensagems.map((msg) => {
            const isOwn = msg.socketId && mySocketId ? msg.socketId === mySocketId : msg.senderId === mySocketId;
            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageBubble,
                  ...(isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther),
                }}
              >
                <div style={styles.messageMeta}>
                  <strong>{msg.sender ?? msg.senderName}</strong> • {msg.time}
                </div>
                <div style={styles.messageText}>{msg.text}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input e botão */}
      <div style={styles.inputRow}>
        <input
          placeholder="Digite aqui a mensagem..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!conectado}
          style={styles.input}
        />
        <button
          onClick={sendMensage}
          disabled={!conectado}
          style={{
            ...styles.button,
            ...(conectado ? styles.buttonEnabled : styles.buttonDisabled),
          }}
        >
          Enviar 📤
        </button>
      </div>
    </div>
  );
};

export default App;

const styles = {
  appContainer: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  },
  title: {
    margin: 0,
    marginBottom: 12,
  },
  statusBox: {
    padding: "10px",
    marginBottom: "20px",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  statusConnected: {
    background: "#d4edda",
    color: "#155724",
  },
  statusDisconnected: {
    background: "#f8d7da",
    color: "#721c24",
  },
  messagesArea: {
    height: "400px",
    border: "1px solid #ccc",
    padding: "15px",
    overflowY: "auto",
    marginBottom: "20px",
    background: "#f5f5f5",
    borderRadius: "8px",
  },
  emptyText: {
    color: "#999",
    textAlign: "center",
    margin: 0,
  },
  messageBubble: {
    marginBottom: "15px",
    padding: "12px",
    borderRadius: "10px",
    maxWidth: "70%",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  messageBubbleOwn: {
    background: "#667eea",
    color: "white",
    marginLeft: "auto",
    marginRight: "0",
  },
  messageBubbleOther: {
    background: "white",
    color: "#333",
    marginLeft: "0",
    marginRight: "auto",
  },
  messageMeta: {
    fontSize: "12px",
    marginBottom: "5px",
    opacity: 0.8,
  },
  messageText: {
    fontSize: "15px",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "12px",
    fontSize: "16px",
    border: "2px solid #ccc",
    borderRadius: "25px",
    outline: "none",
  },
  button: {
    padding: "12px 25px",
    fontSize: "16px",
    color: "white",
    border: "none",
    borderRadius: "25px",
    fontWeight: "bold",
  },
  buttonEnabled: {
    background: "#667eea",
    cursor: "pointer",
  },
  buttonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
  },
};