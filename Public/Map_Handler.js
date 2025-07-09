const socketio = io("https://vehicle2x.site/v2xData/workspace/WEB/"); // Replace with your server URL

mapboxgl.accessToken = "pk.eyJ1IjoibWFyaWlhbW0iLCJhIjoiY2xwYmE2bWVoMGhwczJrcXIxNzlvaTgyaiJ9.rDjlQgOMAzkppYwBVeUG2Q";

///////////////////////////////////////// Initialization section ////////////////////////////////////////////

// Initialize map
let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [31.561155, 30.376138],
  zoom: 15,
});

// Initialize car icon (my own car)
const carIcon = document.createElement("div");
carIcon.className = "car-icon";
carIcon.style.backgroundImage = 'url("./Public/black_car.JPG")';
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
    redcarIcon.style.backgroundImage = 'url("./Public/accident.png")';
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
    redcarIcon.style.backgroundImage = 'url("./Public/red_car.png")';
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

// Helper to get or create a marker for a car by carID
function getOrCreateCarMarker(carID, lng, lat) {
  let markerObj = marker_array.find(m => m.id === carID);
  if (!markerObj) {
    // Create new marker
    const redcarIcon = document.createElement("div");
    redcarIcon.className = "car-icon";
    redcarIcon.style.backgroundImage = 'url("./Public/red_car.png")';
    redcarIcon.style.width = "30px";
    redcarIcon.style.height = "30px";
    redcarIcon.style.backgroundSize = "cover";
    const marker = new mapboxgl.Marker(redcarIcon)
      .setLngLat([lng, lat])
      .addTo(map);
    marker.getElement().id = carID;
    markerObj = { id: carID, marker: marker };
    marker_array.push(markerObj);
  }
  return markerObj.marker;
}

///////////////////////////////////////// Event Listening section //////////////////////////////////////////

let skipNextAnimation = false;

function removeAllRedAndAccidentMarkers() {
  // Remove all markers except the main car (Ali)
  for (let i = marker_array.length - 1; i >= 0; i--) {
    if (marker_array[i].id !== mymarkerId) {
      marker_array[i].marker.remove();
      marker_array.splice(i, 1);
    }
  }
  // Remove all accident markers
  for (let i = accidentMarkers.length - 1; i >= 0; i--) {
    accidentMarkers[i].marker.remove();
    accidentMarkers.splice(i, 1);
  }
  // Remove intersection marker if present
  if (intersectionMarker) {
    intersectionMarker.remove();
    intersectionMarker = null;
  }
  // Reset all warning flags when loop restarts
  suddenBrakeWarningShown = false;
  accidentWarningShown = false;
  intersectionWarningShown = false;
}

socketio.on("sendUserLocation", (currentLocation) => {
  const marker = marker_array[0].marker;
  const from = marker.getLngLat();
  const to = [currentLocation.lon, currentLocation.lat];
  if (skipNextAnimation) {
    // Instantly set marker on the first point of the new loop
    removeAllRedAndAccidentMarkers();
    marker.setLngLat(to);
    map.setCenter(to);
    skipNextAnimation = false;
    console.log("First point after loop: instant jump and markers cleared");
  } else {
    animateMarker(marker, [from.lng, from.lat], to, 5000);
    console.log(currentLocation); // 5 second animation
    // REMOVED: The sudden brake warning from here - it was causing duplicate warnings
    // Only set the skipNextAnimation flag when it's the last point
    if (currentLocation.isLast) {
      skipNextAnimation = true;
    }
  }
});

function animateMarker(marker, from, to, duration = 5000) {
  const start = performance.now();

  function animate(time) {
    const elapsed = time - start;
    const t = Math.min(elapsed / duration, 1); // progress [0,1]

    // Linear interpolation
    const lng = from[0] + (to[0] - from[0]) * t;
    const lat = from[1] + (to[1] - from[1]) * t;

    marker.setLngLat([lng, lat]);
    map.setCenter([lng, lat]);

    if (t < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

// Remove marker event
socketio.on("removemarker", (other_payload) => {
  if (other_payload.carID) {
    removeMarkerById(other_payload.carID);
    // If intersection car removed, reset warning
    intersectionWarningShown = false;
  }
  if (other_payload.accident_id) {
    // Remove accident marker by accident_id
    const markerIndex = accidentMarkers.findIndex(m => m.id === other_payload.accident_id);
    if (markerIndex !== -1) {
      accidentMarkers[markerIndex].marker.remove();
      accidentMarkers.splice(markerIndex, 1);
      console.log(`Accident marker with id ${other_payload.accident_id} removed.`);
    } else {
      console.log(`Accident marker with id ${other_payload.accident_id} not found.`);
    }
  }
  // If all cars removed, reset sudden brake warning
  suddenBrakeWarningShown = false;
});

// Sudden brake event (adding other red cars)
socketio.on("suddenbreak", (intersection_carArray) => {
  marker_type = "red_marker";
  intersection_carArray.forEach((other_car_payload) => {
    // Create sudden brake marker with a unique ID to avoid conflicts
    const suddenBrakePayload = {
      ...other_car_payload,
      carID: other_car_payload.carID + "_suddenbrake" // Make ID unique
    };
    putOrUpdateMap(suddenBrakePayload, marker_type);
  });
  // Only show the warning here - this is the correct place for sudden brake detection
  if (!suddenBrakeWarningShown) {
    addWarningMessage("Sudden brake detected");
    suddenBrakeWarningShown = true;
  }
});

let accidentWarningShown = false;
let intersectionWarningShown = false;
let suddenBrakeWarningShown = false;

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
    redcarIcon.style.backgroundImage = 'url("./Public/red_car.png")';
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

// Listen for intersection car updates and animate smoothly
socketio.on("intersection", (payload) => {
  const marker = getOrCreateCarMarker(payload.carID, payload.lon, payload.lat);
  const from = marker.getLngLat();
  const to = [payload.lon, payload.lat];
  animateMarker(marker, [from.lng, from.lat], to, 5000); // 5 second animation
  if (!intersectionWarningShown) {
    addWarningMessage("Possible intersection, take care!");
    intersectionWarningShown = true;
  }
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

// At the end of the file, set the last coordinate for reference
fetch('/v2xData/workspace/WEB/Public/10th-Data - Copy.txt')
  .then(response => response.text())
  .then(text => {
    const lines = text.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const [lat, lon] = lastLine.split(',').map(Number);
    window.lastCoordinate = { lat, lon };
  })
  .catch(error => {
    console.error('Error fetching coordinates file:', error);
  });