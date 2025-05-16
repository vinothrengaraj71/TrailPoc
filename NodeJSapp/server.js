const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const { OpenAI } = require("openai");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // If user mentions "EeVa", call ChatGPT
  if (newMessage.sender !== "EeVa" && /\bEeVa\b/i.test(newMessage.text)) {
    const aiResponse = await getChatGPTResponse(newMessage.text);
    const botMessage = { sender: "EeVa", text: aiResponse };
    messages.push(botMessage);
    io.emit("receiveMessage", botMessage);
  } else {
    // If "EeVa" is not mentioned, send support message
    const supportMessage = {
      sender: "EeVa",
      text: "Please contact our Support team for more assistance - supportdesk@voidsolutions.in",
    };
    messages.push(supportMessage);
    io.emit("receiveMessage", supportMessage);
  }
});

// Function to get response from OpenAI's ChatGPT
async function getChatGPTResponse(userMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use latest model
      messages: [
        { role: "system", content: "You are EeVa, an AI assistant for Void Solutions. Provide clear and helpful responses." },
        { role: "user", content: userMessage },
      ],
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error with OpenAI:", error);
    return "I'm currently unavailable due to technical issues. Please try again later.";
  }
}

// WebSocket events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("sendMessage", async (data) => {
    messages.push(data);
    io.emit("receiveMessage", data);

    // Check if the message mentions "EeVa"
    if (data.sender !== "EeVa" && /\bEeVa\b/i.test(data.text)) {
      const aiResponse = await getChatGPTResponse(data.text);
      const botMessage = { sender: "EeVa", text: aiResponse };
      messages.push(botMessage);
      io.emit("receiveMessage", botMessage);
    } else {
      // If "EeVa" is not mentioned, send support message
      const supportMessage = {
        sender: "EeVa",
        text: "Please contact our Support team for more assistance - supportdesk@voidsolutions.in",
      };
      messages.push(supportMessage);
      io.emit("receiveMessage", supportMessage);
    }
  });

  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// Start the server
const PORT = process.env.PORT || 5010;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
