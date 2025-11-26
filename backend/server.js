import cors from 'cors';
import express from 'express';
import http from 'http'
import {Server} from 'socket.io'

const app = express();
app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
    res.send("api rodando")
})

const server = http.createServer(app
)

const io = new Server(server,{
    cors: { origin: "*" }
})

io.on("connection",(socket)=>{
    console.log("usuario conectado",socket.id)
    socket.on("message",(data)=>{
        io.emit("message",data)
    })
    socket.on("disconnect",()=>{
        console.log("usuario desconectado",socket.id)
    })
})

server.listen(3000,'0.0.0.0',()=>{
    console.log('servidor rodando')
})