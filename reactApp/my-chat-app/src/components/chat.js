import { useState, useEffect } from "react";
import io from "socket.io-client";
import API from "../api/axiosInstance";

const socket = io("http://localhost:5010");

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [username] = useState(`Guest_${Math.floor(Math.random() * 1000)}`);

  useEffect(() => {
    API.get("/")
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching messages:", err));

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = { sender: username, text: message };

    API.post("/", newMessage).catch((err) => console.error("Error posting message:", err));
    socket.emit("sendMessage", newMessage);

    setMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-4 bg-blue-600 text-white text-lg font-bold text-center">💬 Open Chat with AI</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 rounded-lg w-fit ${msg.sender === username ? "bg-green-300 ml-auto" : msg.sender === "ChatGPT" ? "bg-yellow-300" : "bg-gray-300"}`}>
            <span className="font-semibold">{msg.sender}: </span>{msg.text}
          </div>
        ))}
      </div>

      <div className="p-4 bg-white flex">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-300 rounded-lg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg">Send</button>
      </div>
    </div>
  );
};

export default Chat;
