const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/sender", (req, res) => {
  res.sendFile(__dirname + "/sender.html");
});

let counter = 1;

io.on("connection", (socket) => {
  const userId = counter++;
  io.emit ("connection" , (userId));
  console.log(`User ${userId} Connected`);
  socket.on("chat message", (msg) => {
    io.emit("sendMsgToAllUsers", msg, userId);
    console.log("User" + userId + ":", msg);
  });

  socket.on("myLocation", currentLocation => {
    io.emit("sendMyLocation", currentLocation);
  
  });

  socket.on("accident", (msg, accidentLocation) => {
    io.emit("sendAccidentAlert", msg, accidentLocation);
  });

  socket.on("highSpeed", (msg) => {
    io.emit("sendHighSpeedAlert", msg);
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
