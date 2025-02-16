
const socket = io("http://localhost:3000"); // Replace with your server URL

// Add a blue dot at the static location
let map = L.map("map").setView([30.441392, 31.342281], 12); // استخدام الموقع الأولي

// إضافة طبقات OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// تعريف marker ثابت لتمثيل موقع المستخدم
let userMarker = L.circleMarker([30.441392, 31.342281], {
  radius: 8,
  color: "blue",
  fillColor: "#007bff",
  fillOpacity: 0.8,
})
  .addTo(map)
  .bindPopup(`<strong>انا اهو</strong>`)
  .openPopup();

// Connect to the Socket.IO server

// Chat functionality
const messagesContainer = document.getElementById("messages");
const chatInput = document.getElementById("chat-input");

function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    // Emit the message to the server
    socket.emit("chat message", message);
    chatInput.value = "";
  }
}

// Listen for incoming chat messages
socket.on("chat message", function (msg) {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = msg;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

//   socket.on("sendMsgToAllUsers", function (msg) {
//     var item = document.createElement("li");
//     item.textContent = msg;
//     messages.appendChild(item);
//     window.scrollTo(0, document.body.scrollHeight);
//   });

chatInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// تلقي الموقع المحدث من السيرفر
socket.on("sendMyLocation", (location) => {
  const { lat, lon } = location;

  // تحديث الموقع على الخريطة
  userMarker.setLatLng([lat, lon]);

  // تحديث Popup على marker

  console.log (location);
});

// استماع لرسائل الحوادث القادمة من الخادم
// Listen for accident alerts from the server
socket.on("sendAccidentAlert", function (msg, accidentLocation) {
  // Display the message in the chat
  const messageDiv = document.createElement("div");
  messageDiv.innerHTML = '<strong><span style="color: red;">SYSTEM:</span></strong> ' + msg;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // If accidentLocation is provided, add a red dot on the map
  if (accidentLocation) {
    const { lat, lon } = accidentLocation;

    // Add a red dot at the accident location
    L.circleMarker([lat, lon], {
      radius: 8,
      color: "red",
      fillColor: "#ff0000", // red fill color
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup(`<strong>Accident Location</strong>`)
      .openPopup();
  }
});


socket.on("sendHighSpeedAlert", function (msg) {
  const messageDiv = document.createElement("div");
  messageDiv.innerHTML ='<strong><span style="color: red;">SYSTEM:</span></strong> '+ msg;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
socket.on ("connection" , (userId) => {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = `User ${userId} has connected!`;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
} )

socket.on("sendMsgToAllUsers", function (msg, userId) {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = `User ${userId}: ${msg}`;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});