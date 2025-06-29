// simulation.js

const socket = io("http://4.232.176.214:3000/");
const mapboxToken = "pk.eyJ1IjoibWFyaWlhbW0iLCJhIjoiY2xwYmE2bWVoMGhwczJrcXIxNzlvaTgyaiJ9.rDjlQgOMAzkppYwBVeUG2Q";

// Your car's route
const myStart = [31.33586728719155, 30.4336289299726];
const myEnd = [31.33031519539292, 30.45128188213939];

// Intersecting car's route (choose points that cross your route)
const intersectStart = [31.333090260561697, 30.43908212885358];
const intersectEnd = [31.334928995672268, 30.439979339605337];

const SPEED_M_S = 6; // 50 km/h in meters/second

// Helper: fetch route from Mapbox Directions API
async function fetchRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxToken}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0].geometry.coordinates; // [lng, lat] pairs
}

// Helper: calculate distance between two [lng, lat] points (meters)
function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Helper: interpolate between two [lng, lat] points
function interpolatePoints([lng1, lat1], [lng2, lat2], numPoints) {
  const points = [];
  for (let i = 1; i <= numPoints; i++) {
    const lat = lat1 + (lat2 - lat1) * (i / (numPoints + 1));
    const lng = lng1 + (lng2 - lng1) * (i / (numPoints + 1));
    points.push([lng, lat]);
  }
  return points;
}

// Expand a route with interpolated points
function expandRoute(route, numInterp) {
  const expanded = [];
  for (let i = 0; i < route.length - 1; i++) {
    expanded.push(route[i]);
    expanded.push(...interpolatePoints(route[i], route[i + 1], numInterp));
  }
  expanded.push(route[route.length - 1]);
  return expanded;
}

async function startSimulation() {
  const myRouteRaw = await fetchRoute(myStart, myEnd);
  const intersectRouteRaw = await fetchRoute(intersectStart, intersectEnd);

  // Interpolate 4 points between each pair for smoothness
  const myRoute = expandRoute(myRouteRaw, 10);
  const intersectRoute = expandRoute(intersectRouteRaw, 10);

  let myIndex = 0;
  let intersectIndex = 0;
  let accidentSent = false;
  let intersectionSent = false;

  // Pick a point for the accident (e.g., 1/3 along your route)
  const accidentIdx = Math.floor(myRoute.length / 3);
  const accidentLocation = {
    lat: myRoute[accidentIdx][1],
    lon: myRoute[accidentIdx][0],
    accident_id: "acc1"
  };

  function step() {
    // Move your car
    if (myIndex < myRoute.length) {
      const [lon, lat] = myRoute[myIndex];
      socket.emit("userPayload", {
        lat,
        lon,
        intersection: false,
        accident: false,
        carID: "myCar"
      });
      myIndex++;
    }

    // Move intersecting car
    if (intersectIndex < intersectRoute.length) {
      const [lon, lat] = intersectRoute[intersectIndex];
      socket.emit("userPayload", {
        lat,
        lon,
        intersection: true,
        accident: false,
        carID: "intersectCar"
      });
      intersectIndex++;
    }

    // Accident event
    if (!accidentSent && myIndex === accidentIdx) {
      socket.emit("accident", accidentLocation);
      accidentSent = true;
    }

    // Intersection event: when cars are close (within 20 meters)
    if (!intersectionSent && myIndex < myRoute.length && intersectIndex < intersectRoute.length) {
      const myPos = myRoute[myIndex - 1];
      const intersectPos = intersectRoute[intersectIndex - 1];
      if (haversine(myPos, intersectPos) < 20) {
        socket.emit("intersection", {
          lat: myPos[1],
          lon: myPos[0],
          carID: "intersectCar"
        });
        intersectionSent = true;
      }
    }

    // Calculate delay for next step based on distance and speed
    let myDelay = 1000, intersectDelay = 1000;
    if (myIndex < myRoute.length) {
      const prev = myRoute[myIndex - 1] || myRoute[0];
      const next = myRoute[myIndex] || myRoute[myIndex - 1];
      const dist = haversine(prev, next);
      myDelay = (dist / SPEED_M_S) * 1000;
    }
    if (intersectIndex < intersectRoute.length) {
      const prev = intersectRoute[intersectIndex - 1] || intersectRoute[0];
      const next = intersectRoute[intersectIndex] || intersectRoute[intersectIndex - 1];
      const dist = haversine(prev, next);
      intersectDelay = (dist / SPEED_M_S) * 1000;
    }
    const delay = Math.min(myDelay, intersectDelay);

    if (myIndex < myRoute.length || intersectIndex < intersectRoute.length) {
      setTimeout(step, delay);
    }
  }

  step();
}

startSimulation();
