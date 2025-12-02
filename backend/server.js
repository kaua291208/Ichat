const { Server } = require("socket.io");
const { createClient } = require("@supabase/supabase-js");

// ======= SUPABASE CONFIG =======
const supabaseUrl = "https://hiffivxszvipbhjkmjge.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmZpdnhzenZpcGJoamttamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTk3MTQsImV4cCI6MjA3OTgzNTcxNH0.ARaOUOBvZhep3WQ5DeDFH7L_WX602Wq4h67I2LJWyWI";
const supabase = createClient(supabaseUrl, supabaseKey);

const io = new Server(3000, {
  cors: {
    origin: "*"
  }
});

// ======= USERS CONECTADOS (EM MEMÓRIA) =======
const users = new Map();
// number => { socketId, role }

// ======= HELPER FUNCTIONS =======

async function getOrCreateUser(number, role) {
  try {
    // Verifica se usuário existe
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("number", number)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar usuário:", error);
      return null;
    }

    // Se não existe, cria
    if (! user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ number, role }])
        .select()
        . single();

      if (createError) {
        console.error("Erro ao criar usuário:", createError);
        return null;
      }

      user = newUser;
      console.log("✅ Usuário criado:", number);
    } else {
      console.log("✅ Usuário encontrado:", number);
    }

    return user;
  } catch (err) {
    console.error("Erro em getOrCreateUser:", err);
    return null;
  }
}

async function getOrCreateConversation(userA, userB) {
  try {
    // Normaliza a ordem para evitar duplicatas (sempre coloca o menor primeiro)
    const [user_a, user_b] = [userA, userB].sort();

    console.log("🔍 Buscando conversa entre:", user_a, "e", user_b);

    // MÉTODO CORRIGIDO: Busca usando filtros separados
    let { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user_a.eq.${user_a},user_b. eq.${user_b}),and(user_a.eq. ${user_b},user_b.eq.${user_a})`);

    // Se der erro, tenta método alternativo mais simples
    if (error) {
      console.log("⚠️ Erro no método OR, tentando método alternativo.. .");
      
      // Busca todas as conversas que envolvem ambos os usuários
      const { data: allConvs, error: error2 } = await supabase
        .from("conversations")
        .select("*");

      if (error2) {
        console.error("Erro ao buscar conversas:", error2);
        return null;
      }

      // Filtra manualmente
      conversations = allConvs.filter(conv => 
        (conv.user_a === user_a && conv.user_b === user_b) ||
        (conv.user_a === user_b && conv.user_b === user_a)
      );
    }

    let conversation = conversations && conversations.length > 0 ?  conversations[0] : null;

    // Se não existe, cria
    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert([{ user_a, user_b }])
        .select()
        .single();

      if (createError) {
        console.error("Erro ao criar conversa:", createError);
        return null;
      }

      conversation = newConv;
      console.log("✅ Conversa criada:", conversation.id);
    } else {
      console.log("✅ Conversa existente:", conversation.id);
    }

    return conversation;
  } catch (err) {
    console.error("Erro em getOrCreateConversation:", err);
    return null;
  }
}

async function saveMessage(conversationId, fromUser, text) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          from_user: fromUser,
          text
        }
      ])
      .select()
      . single();

    if (error) {
      console.error("Erro ao salvar mensagem:", error);
      return null;
    }

    console.log("✅ Mensagem salva:", data. id);
    return data;
  } catch (err) {
    console.error("Erro em saveMessage:", err);
    return null;
  }
}

async function getConversationHistory(conversationId) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      . eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }

    return data. map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      from: msg.from_user,
      text: msg.text,
      date: msg.created_at
    }));
  } catch (err) {
    console.error("Erro em getConversationHistory:", err);
    return [];
  }
}

async function getUserConversations(userNumber) {
  try {
    // Busca todas as conversas
    const { data: allConvs, error } = await supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar conversas:", error);
      return [];
    }

    // Filtra manualmente as conversas do usuário
    const userConvs = allConvs.filter(conv => 
      conv. user_a === userNumber || conv.user_b === userNumber
    );

    return userConvs. map(conv => ({
      id: conv.id,
      with: conv.user_a === userNumber ? conv.user_b : conv.user_a,
      users: [conv.user_a, conv. user_b]
    }));
  } catch (err) {
    console. error("Erro em getUserConversations:", err);
    return [];
  }
}

function updateAgents() {
  const agents = [];

  for (const [number, data] of users) {
    if (data.role === "web") {
      agents.push({ number });
    }
  }

  console.log("📋 Atendentes online:", agents);
  io.emit("agents:list", agents);
}

// ====================================
// SOCKET EVENTS
// ====================================

io. on("connection", (socket) => {
  console.log("🔌 Socket conectado:", socket.id);

  // ======= LOGIN =======
  socket.on("login", async ({ number, role }) => {
    if (! number) return;

    // Cria ou busca usuário no banco
    const user = await getOrCreateUser(number, role);
    if (!user) {
      socket.emit("error", { message: "Erro ao autenticar usuário" });
      return;
    }

    socket.number = number;

    users.set(number, {
      socketId: socket.id,
      role
    });

    console.log("✅ Login:", number, role);

    // Busca conversas existentes do usuário
    const userConversations = await getUserConversations(number);
    socket.emit("conversations:load", userConversations);

    updateAgents();
  });

  // ======= CRIAR/BUSCAR CONVERSA =======
  socket.on("conversation:start", async ({ with: target }) => {
    const from = socket.number;

    if (!from || !target) {
      console.log("❌ Dados inválidos para criar conversa");
      return;
    }

    console.log("🔄 Tentando criar conversa entre", from, "e", target);

    // Verifica se o target existe no banco
    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("number")
      .eq("number", target)
      .single();

    if (targetError && targetError.code !== "PGRST116") {
      console.log("❌ Erro ao verificar usuário alvo:", targetError);
      socket.emit("error", { message: "Erro ao verificar atendente" });
      return;
    }

    // Se o usuário não existe, cria ele
    if (!targetUser) {
      console.log("📝 Criando usuário alvo:", target);
      const newTargetUser = await getOrCreateUser(target, "web");
      if (!newTargetUser) {
        socket.emit("error", { message: "Erro ao criar atendente" });
        return;
      }
    }

    // Cria ou busca conversa existente
    const conversation = await getOrCreateConversation(from, target);
    if (!conversation) {
      socket.emit("error", { message: "Erro ao criar conversa" });
      return;
    }

    // Envia conversa para o usuário que iniciou
    socket.emit("conversation:created", {
      id: conversation.id,
      with: target
    });

    // Se o target estiver online, notifica ele também
    if (users.has(target)) {
      const targetSocketId = users.get(target). socketId;
      io.to(targetSocketId).emit("conversation:created", {
        id: conversation.id,
        with: from
      });
    }
  });

  // ======= PEDIR HISTORICO =======
  socket.on("conversation:history", async ({ conversation_id }) => {
    const messages = await getConversationHistory(conversation_id);
    socket. emit("conversation:history", messages);
  });

  // ======= MANDAR MSG =======
  socket.on("message:send", async ({ conversation_id, text }) => {
    const from = socket.number;

    if (!from || !text || ! text.trim()) {
      console. log("❌ Mensagem inválida");
      return;
    }

    // Busca conversa no banco
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .single();

    if (error || !conversation) {
      console. log("❌ Conversa não encontrada:", conversation_id);
      socket. emit("error", { message: "Conversa não encontrada" });
      return;
    }

    // Salva mensagem no banco
    const savedMessage = await saveMessage(conversation_id, from, text);
    if (!savedMessage) {
      socket.emit("error", { message: "Erro ao enviar mensagem" });
      return;
    }

    const msg = {
      id: savedMessage.id,
      conversation_id: conversation_id,
      from: from,
      text: text,
      date: savedMessage.created_at
    };

    // Envia mensagem para todos os participantes da conversa
    const participants = [conversation.user_a, conversation.user_b];

    for (const userNumber of participants) {
      const userData = users.get(userNumber);
      if (userData) {
        io.to(userData.socketId).emit("message", msg);
      }
    }
  });

  // ======= DISCONNECT =======
  socket.on("disconnect", () => {
    if (! socket.number) return;

    console.log("❌ Desconectado:", socket.number);
    users.delete(socket.number);
    updateAgents();
  });
});

console.log("🚀 Server rodando na porta 3000");
console.log("📦 Supabase conectado");