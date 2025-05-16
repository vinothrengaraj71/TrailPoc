const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
const PORT = 5011;

const userTokens = {};

app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./accountkey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let tokens = []; // In real world, store in DB

app.post("/register", (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) {
    return res.status(400).send("userId and token required");
  }
  userTokens[userId] = token;
  console.log(`Registered token for ${userId}: ${token}`);
  res.sendStatus(200);
});

app.post("/send", async (req, res) => {
  const { title, body } = req.body;

  const message = {
    notification: {
      title,
      body,
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("Successfully sent message:", response);
    res.status(200).send(response);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send(error);
  }
});

app.post("/sendToUser", async (req, res) => {
  const { userId, title, body } = req.body;

  const token = userTokens[userId];
  if (!token) {
    return res.status(404).send("User not registered or token not found");
  }

  const message = {
    notification: { title, body },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`Sent message to ${userId}:`, response);
    res.status(200).send(response);
  } catch (error) {
    console.error(`Error sending to ${userId}:`, error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
