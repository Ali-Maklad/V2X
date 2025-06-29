const mqtt = require("mqtt");
const connectUrl = "mqtt://broker.emqx.io";
const clientId = "mqttx_1f8654bb";
const { io } = require("socket.io-client");
const socket = io("http://4.232.176.214:3000/#");

let isConnected = false;

function mqttHandler() {
  if (isConnected) {
    console.log("MQTT is already connected.");
    return;
  }

  const client = mqtt.connect(connectUrl, { clientId });

  client.on("connect", () => {
    isConnected = true;
    console.log("MQTT Connected!");
    client.subscribe("Location", (err) => {
      if (!err) console.log("Subscribed to topic Location");
    });
    client.subscribe("Accident", (err) => {
      if (!err) console.log("Subscribed to topic Accident");
    });
    client.subscribe("HighSpeed", (err) => {
      if (!err) console.log("Subscribed to topic HighSpeed");
    });
  });

  client.on("message", (topic, message) => {
    console.log(`Received message on topic [${topic}]: ${message.toString()}`);
    if (topic === "Location") {
      const gpsData = JSON.parse(message.toString());
      socket.emit("myLocation", gpsData);
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
