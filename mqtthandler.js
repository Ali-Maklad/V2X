const mqtt = require("mqtt");
const connectUrl = "mqtt://broker.emqx.io";
const clientId = "mqttx_1f8654bb";
const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

function mqttHandler () {

  const client = mqtt.connect(connectUrl, { clientId });
  const testMessage = "Is Socket.io working?";
  socket.emit("Test", testMessage);

  client.on("connect", () => {
    console.log("MQTT Connected!");
    client.subscribe("Location", (err) => {
      console.log(`Subscribe to topic Location`);
    });
    client.subscribe("Accident", (err) => {
      console.log(`Subscribe to topic Accident`);
    });
    client.subscribe("HighSpeed", (err) => {
      console.log(`Subscribe to topic HighSpeed`);
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
};

module.exports = mqttHandler;