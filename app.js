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

  socket.on("userPayload", (Payload) => {
    if (Payload.intersection == false && Payload.accident == false) {
      console.log(Payload);
      io.emit("sendUserLocation", Payload);
    } else if (Payload.intersection == true && Payload.accident == false) {
      console.log("Intersection Alert from app.js:", Payload);
      io.emit("intersectionDetected", Payload);
    }
  });

  socket.on("accident", (accidentLocation) => {
    console.log("Accident Alert from app.js:", accidentLocation);
    io.emit("accidentDetected", accidentLocation);
  });

  socket.on("highSpeed", (msg) => {
    io.emit("sendHighSpeedAlert", msg);
  });

  socket.on("intersection", (car2Location) => {
    console.log("Intersection Alert from app.js:", car2Location);
    io.emit("intersectionDetected", car2Location);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
