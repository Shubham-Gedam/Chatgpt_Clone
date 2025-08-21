const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require('../models/user.model')
const aiService = require('../services/ai.service')
const messageModel = require('../models/message.model')
const {CreateMemory,queryMemory} = require('../services/vector.service')
function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  /* Socket.io Middleware  */
  io.use(async(socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");

    

    const token = cookies.token; // yahan se token milega
    if (!token) {
      return next(new Error("Authentication error: No token provided")); 
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); //  token verify
      
      const user = await userModel.findById(decoded.id)

      socket.user = user // user info socket me attach
      
      next();

    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    
    //Listner
    socket.on("ai-message",async(messagePlayload)=>{

        console.log(messagePlayload);

        await messageModel.create({
          chat: messagePlayload.chat,
          user: socket.user._id,
          content: messagePlayload.content,
          role: "user"
        })

        const chatHistory = await messageModel.find({
          chat: messagePlayload.chat
        })

        const responce = await aiService.generateResponse(chatHistory.map(item=>{
          return{
            role: item.role,
            parts: [{text: item.content}]
          }
        }))
        
        await messageModel.create({
        chat: messagePlayload.chat,
        user: socket.user._id,  //  actual ObjectId pass karo
        content: responce,
        role: "model"
        })

        socket.emit("ai-response",{
          content: responce,
          chat: messagePlayload.chat
        })
    })
  });
}

module.exports = initSocketServer;
