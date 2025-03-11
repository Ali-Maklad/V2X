const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const mqttHandler = require("./mqtthandler.js");
mqttHandler();

app.use(express.static(__dirname + "/Public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/sender", (req, res) => {
  res.sendFile(__dirname + "/sender.html");
});

let counter = 1;

io.on("connection", (socket) => {

  const userId = counter++;
  io.emit("connection", userId);
  console.log(`User ${userId} Connected`);
  
  socket.on("Test", (testMessage) => {
    console.log(testMessage);
  });

  socket.on("chat message", (msg) => {
    io.emit("sendMsgToAllUsers", msg, userId);
    console.log("User" + userId + ":", msg);
  });

  socket.on("myLocation", (currentLocation) => {
    console.log(currentLocation);
    io.emit("sendMyLocation", currentLocation);
  });

  socket.on("accident", (message, accidentLocation) => {
    console.log("Accident Alert from app.js:", accidentLocation);
    io.emit("sendAccidentAlert", message, accidentLocation);
  });

  socket.on("highSpeed", (msg) => {
    io.emit("sendHighSpeedAlert", msg);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
