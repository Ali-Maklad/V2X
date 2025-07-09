const fs = require("fs");
const { io } = require("socket.io-client");

// Connect to the Socket.IO server
const socket = io("http://74.161.160.117:3000/"); // Change if your server runs elsewhere

// Accident 1 (original case)
const accident1 = { lat: 30.363138, lon: 31.587069, accident_id: "accident1" };
// Intersection accident (if you want a second accident marker, define it here)
// const accident2 = { lat: 30.364444, lon: 31.616428, accident_id: 'accident2' };

// Read the data file
const data = fs.readFileSync("10th-Data - Copy.txt", "utf-8");
const lines = data.trim().split("\n");

// Parse coordinates
const coordinates = lines.map((line) => {
  const [lat, lon] = line.split(",").map(Number);
  return { lat, lon, intersection: false, accident: false };
});

// Accident 1 segment
const accident1StartIdx = coordinates.findIndex(
  (p) => p.lat === 30.35508 && p.lon === 31.595384
);
const accident1EndIdx = coordinates.findIndex(
  (p) => p.lat === 30.327919 && p.lon === 31.647782
);

// Intersection simulation
const intersectionStartIdx = coordinates.findIndex(
  (p) => p.lat === 30.299144 && p.lon === 31.688991
);
const intersectionEndIdx = coordinates.findIndex(
  (p) => p.lat === 30.307236 && p.lon === 31.704437
);
const otherCarPath = [
  { lat: 30.305063, lon: 31.693226 },
  { lat: 30.301394, lon: 31.69387 },
  { lat: 30.297578, lon: 31.696961 },
];
const otherCarID = "intersectionCar1";
let intersectionActive = false;
let intersectionStep = 0;

let index = 0;
let accident1Active = false;

function sendNext() {
  if (index < coordinates.length) {
    const payload = coordinates[index];
    socket.emit("userPayload", payload);

    // Accident 1 logic (original case)
    if (index === accident1StartIdx && !accident1Active) {
      socket.emit("accident", accident1);
      accident1Active = true;
    }
    if (index === accident1EndIdx + 1 && accident1Active) {
      socket.emit("removemarker", { accident_id: "accident1" });
      accident1Active = false;
    }

    // Intersection logic (separate)
    if (index === intersectionStartIdx && !intersectionActive) {
      intersectionActive = true;
      intersectionStep = 0;
      emitOtherCarStep();
    }
    if (index === intersectionEndIdx + 1 && intersectionActive) {
      intersectionActive = false;
      // Remove the other car marker if not already removed
      socket.emit("removemarker", { carID: otherCarID });
    }

    index++;
    setTimeout(sendNext, 5000);
  } else {
    // Car has stopped at the last point, emit sudden brake
    const lastPayload = coordinates[coordinates.length - 1];
    const fixedPayload = {
      lat: lastPayload.lat,
      lon: lastPayload.lon,
      lng: lastPayload.lon, // 💡 Mapbox needs this
      intersection: false,
      accident: false,
      carID: "Ali",
    };
    socket.emit("suddenbreak", [fixedPayload]);
    console.log("Sudden brake event emitted for the last point.");
    setTimeout(() => {
      socket.disconnect();
    }, 1000);
  }
}

function emitOtherCarStep() {
  if (intersectionActive && intersectionStep < otherCarPath.length) {
    const otherPayload = {
      ...otherCarPath[intersectionStep],
      carID: otherCarID,
    };
    socket.emit("intersection", otherPayload);
    intersectionStep++;
    setTimeout(emitOtherCarStep, 5000);
  } else if (intersectionActive) {
    // Remove the other car marker after the last step
    socket.emit("removemarker", { carID: otherCarID });
  }
}

socket.on("connect", () => {
  console.log("Connected to Socket.IO server. Starting simulation...");
  sendNext();
});
