import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hiffivxszvipbhjkmjge.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpZmZpdnhzenZpcGJoamttamdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTk3MTQsImV4cCI6MjA3OTgzNTcxNH0.ARaOUOBvZhep3WQ5DeDFH7L_WX602Wq4h67I2LJWyWI';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("api rodando com supabase");
});

// ✅ Endpoint para buscar histórico
app.get("/api/messages", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`📜 Enviando ${data.length} mensagens`);
    res.json(data);
  } catch (error) {
    console.error('❌ Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

io.on("connection", (socket) => {
  console.log("✅ Usuario conectado:", socket.id);
  
  socket.on("message", async (data) => {
    console.log("📩 Mensagem recebida:", data);
    
    try {
      // ✅ Salvar no Supabase
      const { error } = await supabase
        .from('messages')
        .insert([{
          id: data.id,
          text: data.text,
          sender_id: data.senderId,
          sender_name: data.senderName,
          time: data.time
        }]);

      if (error) {
        console.error('❌ Erro ao salvar:', error);
      } else {
        console.log('💾 Mensagem salva no Supabase');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
    }
    
    io.emit("message", data);
  });
  
  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado:", socket.id);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Servidor rodando em http://0.0.0.0:3000');
});