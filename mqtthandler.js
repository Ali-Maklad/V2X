const mqtt = require("mqtt");
const { io } = require("socket.io-client");

const connectUrl = "mqtt://broker.emqx.io";
const clientId = "mqttx_1f8654bb";
const socket = io("https://v2x-production.up.railway.app/");

let client = null; // تخزين الاتصال الحالي

function mqttHandler() {
  if (client) {
    console.log("MQTT already connected. Skipping new connection.");
    return;
  }

  client = mqtt.connect(connectUrl, { clientId });

  client.on("connect", () => {
    console.log("MQTT Connected!");

    const topics = ["Location", "Accident", "HighSpeed"];
    topics.forEach(topic => {
      client.subscribe(topic, (err) => {
        if (!err) {
          console.log(`Subscribed to topic: ${topic}`);
        }
      });
    });
  });

  client.on("message", (topic, message) => {
    console.log(`Received message on topic [${topic}]: ${message.toString()}`);
    
    const parsedMessage = JSON.parse(message.toString());
    if (topic === "Location") {
      socket.emit("myLocation", parsedMessage);
    } else if (topic === "Accident") {
      console.log("Accident Alert:", parsedMessage);
      socket.emit("accident", parsedMessage);
    } else if (topic === "HighSpeed") {
      console.log("HighSpeed Alert:", parsedMessage);
      socket.emit("highSpeed", parsedMessage);
    }
  });

  client.on("error", (err) => {
    console.error("MQTT Error:", err);
  });

  client.on("close", () => {
    console.log("MQTT Connection closed!");
    client = null; // إعادة تعيين client للسماح بإعادة الاتصال إذا لزم الأمر
  });
}

module.exports = mqttHandler;
