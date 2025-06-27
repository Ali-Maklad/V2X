const socketio = io("http://localhost:3000/"); // Replace with your server URL

mapboxgl.accessToken = "pk.eyJ1IjoibWFyaWlhbW0iLCJhIjoiY2xwYmE2bWVoMGhwczJrcXIxNzlvaTgyaiJ9.rDjlQgOMAzkppYwBVeUG2Q";

///////////////////////////////////////// Initialization section ////////////////////////////////////////////

// Initialize map
let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [31.342281, 30.441392],
  zoom: 15,
});

// Initialize car icon (my own car)
const carIcon = document.createElement("div");
carIcon.className = "car-icon";
carIcon.style.backgroundImage = 'url("./black_car.JPG")';
carIcon.style.width = "30px";
carIcon.style.height = "30px";
carIcon.style.backgroundSize = "cover";

// Set my car icon to a marker
let mymarker = new mapboxgl.Marker(carIcon)
  .setLngLat([map.getCenter().lng, map.getCenter().lat])
  .addTo(map);

// Set a custom ID for my marker
const mymarkerId = "Ali";
mymarker.getElement().id = mymarkerId;

// Initialize marker arrays
let marker_array = [];
let accidentMarkers = [];
let intersectionMarker = null; // ➔ New: special marker for intersection

marker_array.push({ id: mymarkerId, marker: mymarker });
let marker_type = "red_marker";

///////////////////////////////////////// Function section /////////////////////////////////////////////////

function createMarker(payload, marker_type) {
  const redcarIcon = document.createElement("div");
  redcarIcon.className = "car-icon";
  
  if (marker_type == "accident") {
    redcarIcon.style.backgroundImage = 'url("./accident.png")';
    redcarIcon.style.width = "30px";
    redcarIcon.style.height = "30px";
    redcarIcon.style.backgroundSize = "cover";

    const marker = new mapboxgl.Marker(redcarIcon)
      .setLngLat([payload.lon, payload.lat])
      .addTo(map);
    
    console.log("Here is an accident: ", payload.lon, payload.lat);

    marker.getElement().id = payload.accident_id;
    accidentMarkers.push({ id: payload.accident_id, marker: marker });

  } else {
    // For general red car markers (other cars)
    redcarIcon.style.backgroundImage = 'url("./red_car.png")';
    redcarIcon.style.width = "30px";
    redcarIcon.style.height = "30px";
    redcarIcon.style.backgroundSize = "cover";

    const marker = new mapboxgl.Marker(redcarIcon)
      .setLngLat([payload.lng, payload.lat])
      .addTo(map);

    let markerId = payload.carID;
    marker.getElement().id = markerId;
    marker_array.push({ id: markerId, marker: marker });
  }
}

function removeMarkerById(id) {
  const markerIndex = marker_array.findIndex(
    (markerObj) => markerObj.id === id
  );
  if (markerIndex !== -1) {
    const markerObject = marker_array[markerIndex];
    markerObject.marker.remove();
    marker_array.splice(markerIndex, 1);
    console.log(`Marker with id ${id} removed.`);
  } else {
    console.log(`Marker with id ${id} not found.`);
  }
}

function removeAllMarkers() {
  for (let i = 0; i < marker_array.length; i++) {
    if (marker_array[i].id !== mymarkerId) {
      marker_array[i].marker.remove();
      marker_array.splice(i, 1);
      i--;
    }
  }
}

function putOrUpdateMap(payload, marker_type) {
  createMarker(payload, marker_type);
}

///////////////////////////////////////// Event Listening section //////////////////////////////////////////

// My own location updating
socketio.on("sendUserLocation", (currentLocation) => {
  console.log(currentLocation.lon, currentLocation.lat);
  marker_array[0].marker.setLngLat([currentLocation.lon, currentLocation.lat]);
  map.setCenter([currentLocation.lon, currentLocation.lat]);
});

// Remove marker event
socketio.on("removemarker", (other_payload) => {
  removeMarkerById(other_payload.carID);
});

// Sudden brake event (adding other red cars)
socketio.on("suddenbreak", (intersection_carArray) => {
  marker_type = "red_marker";
  intersection_carArray.forEach((other_car_payload) => {
    putOrUpdateMap(other_car_payload, marker_type);
  });
});

let accidentWarningShown = false;
let intersectionWarningShown = false;

// Accident detected event
socketio.on("accidentDetected", (other_payload) => {
  console.log("Inside accident event ***************");
  marker_type = "accident";
  putOrUpdateMap(other_payload, marker_type);
  if (!accidentWarningShown) {
    addWarningMessage("Accident detected! Be careful in the area.");
    accidentWarningShown = true;
  }
});

// Intersection detected event (special handling)
socketio.on("intersectionDetected", (payload) => {
  console.log("Intersection detected from front-end.");

  if (intersectionMarker === null) {
    // First time: create marker
    const redcarIcon = document.createElement("div");
    redcarIcon.className = "car-icon";
    redcarIcon.style.backgroundImage = 'url("./red_car.png")';
    redcarIcon.style.width = "30px";
    redcarIcon.style.height = "30px";
    redcarIcon.style.backgroundSize = "cover";

    intersectionMarker = new mapboxgl.Marker(redcarIcon)
      .setLngLat([payload.lon, payload.lat])
      .addTo(map);

  } else {
    // Update marker position
    intersectionMarker.setLngLat([payload.lon, payload.lat]);
  }
  if (!intersectionWarningShown) {
    addWarningMessage("Intersection detected! Watch out for crossing vehicles.");
    intersectionWarningShown = true;
  }
});

// Delete all markers when leaving
socketio.on("delete_markers", () => {
  removeAllMarkers();
});

// Helper function to add warning messages to the UI
function addWarningMessage(message) {
  const container = document.getElementById("message-container");
  if (container) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message warning-message";
    msgDiv.textContent = message;
    container.appendChild(msgDiv);
    // Optionally, scroll to the latest message
    container.scrollTop = container.scrollHeight;
  }
}

///////////////////////////////////////// End of code ///////////////////////////////////////////
