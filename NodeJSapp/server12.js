const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const axios = require("axios");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1";

let messages = []; // In-memory message store

// REST API to get messages
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

// REST API to send a message
app.post("/api/messages", async (req, res) => {
  const newMessage = req.body;
  messages.push(newMessage);
  res.status(201).json(newMessage);

  // If the user is not AI, call DeepSeek
  if (newMessage.sender !== "DeepSeek") {
    const aiResponse = await getDeepSeekResponse(newMessage.text);
    const botMessage = { sender: "DeepSeek", text: aiResponse };
    messages.push(botMessage);
    io.emit("receiveMessage", botMessage);
  }
});

// Function to get response from DeepSeek
async function getDeepSeekResponse(userMessage) {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        prompt: userMessage,
        max_tokens: 150,
      },
      {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].text.trim(); // Adjust based on DeepSeek's response
  } catch (error) {
    console.error("Error with DeepSeek:", error);
    return "Sorry, I am having trouble responding right now.";
  }
}

// WebSocket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    messages.push(data);
    io.emit("receiveMessage", data);

    // AI Response
    if (data.sender !== "DeepSeek") {
      const aiResponse = await getDeepSeekResponse(data.text);
      const botMessage = { sender: "DeepSeek", text: aiResponse };
      messages.push(botMessage);
      io.emit("receiveMessage", botMessage);
    }
  });

  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// Start the server
const PORT = process.env.PORT || 5010;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));