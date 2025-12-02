const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*"
  }
});

// ======= USERS CONECTADOS =======
const users2 = new Map();
// number => { socketId, role }

// ======= CONVERSAS =======
const conversations2 = new Map();
// convId => { id, users:[a,b], messages:[] }

function updateAgents() {

  const agents = [];

  for (const [number, data] of users2) {
    if (data.role === "web") {
      agents.push({ number });
    }
  }

  io.emit("agents:list", agents);
}

// ====================================

io.on("connection", (socket) => {

  console.log("🔌 conectado:", socket.id);

  // ======= LOGIN =======
  socket.on("login", ({ number, role }) => {

    if (!number) return;

    socket.number = number;

    users2.set(number, {
      socketId: socket.id,
      role
    });

    console.log("✅ login:", number, role);

    updateAgents();
  });

  // ======= CRIAR CONVERSA =======
  socket.on("conversation:start", ({ with: target }) => {

    const from = socket.number;

    if (!from || !users2.has(target)) return;

    const id = "conv-" + Date.now();

    const conv = {
      id,
      users: [from, target],
      messages2: []
    };

    conversations2.set(id, conv);

    for (const u of conv.users2) {
      const sId = users2.get(u).socketId;

      io.to(sId).emit("conversation:created", {
        id,
        with: u === from ? target : from
      });
    }

  });

  // ======= PEDIR HISTORICO =======
  socket.on("conversation:history", ({ conversation_id }) => {

    const conv = conversations2.get(conversation_id);

    socket.emit("conversation:history", conv.messages2 || []);

  });

  // ======= MANDAR MSG =======
  socket.on("message:send", ({ conversation_id, text }) => {

    const from = socket.number;

    if (!from || !text) return;

    const conv = conversations2.get(conversation_id);
    if (!conv) return;

    const msg = {
      id: Date.now(),
      conversation_id,
      from,
      text,
      date: new Date()
    };

    conv.messages2.push(msg);

    for (const u of conv.users2) {

      const sId = users2.get(u)?.socketId;

      if (sId) {
        io.to(sId).emit("message", msg);
      }

    }

  });

  // ======= DISCONNECT =======
  socket.on("disconnect", () => {

    if (!socket.number) return;

    console.log("❌ saiu:", socket.number);

    users2.delete(socket.number);

    updateAgents();

  });

});

console.log("🚀 Server rodando na porta 3000");
