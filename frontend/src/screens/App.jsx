import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  autoConnect: true,
});

const App = () => {
  const [mensagems, setMensagems] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {


    loadHistory();

    socket.on("connect", () => {
      console.log("✅ Conectado ao servidor:", socket.id);
      setConectado(true);
    });

    socket.on("message", (data) => {
      console.log("📩 Mensagem recebida:", data);
      
      // ✅ EVITAR DUPLICATAS
      setMensagems((prev) => {
        const exists = prev.some(msg => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    async function loadHistory() {
      try {
        console.log('📜 Carregando histórico...');
        const response = await fetch('http://10.1.156.206:3000/api/messages');
        const history = await response.json();
        console.log(`✅ ${history.length} mensagens carregadas`);
        setMensagems(history);
      } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
      }
    }

    socket.on("connect", () => {
      console.log("✅ Conectado ao servidor:", socket.id);
      setConectado(true);
    });

    socket.on("message", (data) => {
      console.log("📩 Mensagem recebida:", data);
      setMensagems((prev) => [...prev, data]);
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado");
      setConectado(false);
    });

    return () => {
      socket.off("connect");
      socket.off("message");
      socket.off("disconnect");
    };
  }, []);

  const sendMensage = () => {
    if (mensagem.trim().length === 0) return;

    const newMessage = {
      id: `${Date.now()}-${socket.id}`, // id único (string)
      text: mensagem.trim(),
      sender: "Web",
      senderId: socket.id,
      senderName: "Web",
      socketId: socket.id,
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    console.log("📤 Enviando:", newMessage);
    socket.emit("message", newMessage);
    setMensagem("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMensage();
    }
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
          <p style={styles.emptyText}>
            Nenhuma mensagem ainda...   Seja o primeiro!   🚀
          </p>
        ) : (
          mensagems.map((msg, index) => {
            const isOwn = msg.socketId === socket.id;
            return (
              <div
                key={index}
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
      </div>

      {/* Input e botão */}
      <div style={styles.inputRow}>
        <input
          placeholder="Digite aqui a mensagem..."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          onKeyPress={handleKeyPress}
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