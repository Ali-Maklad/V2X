const mqtt = require("mqtt");
const connectUrl = "mqtt://135.220.160.216";
const clientId = "AliMaklad";
const { io } = require("socket.io-client");
const socket = io("http://74.161.160.117:3000/");

let isConnected = false;

function mqttHandler() {
  if (isConnected) {
    console.log("MQTT is already connected.");
    return;
  }

  const client = mqtt.connect(connectUrl, {
    clientId: clientId,
    username: "mahmoud",
    password: "1234",
    port: 1883,
  });

  client.on("connect", () => {
    isConnected = true;
    console.log("MQTT Connected!");
    client.subscribe("data", (err) => {
      if (!err) console.log("Subscribed to topic data");
    });
  });

  client.on("message", (topic, message) => {
    console.log(`Received message on topic [${topic}]: ${message.toString()}`);
    if (topic === "data") {
      const gpsData = JSON.parse(message.toString());
      socket.emit("myLocation", gpsData);
      console.log("Data Received from broker:", gpsData);
    } else if (topic === "Accident") {
      const accidentLocation = JSON.parse(message.toString());
      console.log("Accident Alert:", accidentLocation);
      socket.emit("accident", accidentLocation);
    } else if (topic === "HighSpeed") {
      const highSpeedAlert = JSON.parse(message.toString());
      console.log("HighSpeed Alert:", highSpeedAlert);
      socket.emit("highSpeed", highSpeedAlert);
    }
  });

  client.on("close", () => {
    isConnected = false;
    console.log("MQTT Disconnected.");
  });

  client.on("error", (err) => {
    console.error("MQTT Error:", err);
  });
}

module.exports = mqttHandler;
