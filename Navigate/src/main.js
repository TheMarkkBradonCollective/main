import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const statusEl = document.getElementById('gps-status');
const destInput = document.getElementById('destination');
const routePanel = document.getElementById('route-panel');
const routeSummary = document.getElementById('route-summary');
const routeSteps = document.getElementById('route-steps');

let map;
let userMarker;
let routeLayer;
let watchId = null;
let currentPosition = null;
let activeRoute = null;

const SACRAMENTO = { lat: 38.5816, lng: -121.4944 };

function setStatus(text, ok = true) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.classList.toggle('ok', ok);
  statusEl.classList.toggle('warn', !ok);
}

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([SACRAMENTO.lat, SACRAMENTO.lng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  userMarker = L.circleMarker([SACRAMENTO.lat, SACRAMENTO.lng], {
    radius: 10,
    color: '#4cc9f0',
    fillColor: '#4cc9f0',
    fillOpacity: 0.85,
    weight: 2,
  }).addTo(map);
}

async function getPosition() {
  if (Capacitor.isNativePlatform()) {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
      await Geolocation.requestPermissions();
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  }
  if (!navigator.geolocation) throw new Error('Geolocation unavailable');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

function updateUserMarker(pos) {
  currentPosition = pos;
  userMarker.setLatLng([pos.lat, pos.lng]);
  map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.4 });
  setStatus(`GPS · ±${Math.round(pos.accuracy || 0)}m`, true);
}

async function refreshLocation() {
  try {
    const pos = await getPosition();
    updateUserMarker(pos);
  } catch (err) {
    setStatus(err.message || 'GPS unavailable', false);
  }
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  if (!data.length) throw new Error('No results for that destination');
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), label: data[0].display_name };
}

async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Routing failed');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');
  return data.routes[0];
}

function drawRoute(route, destLabel) {
  if (routeLayer) map.removeLayer(routeLayer);
  const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  routeLayer = L.polyline(coords, { color: '#4cc9f0', weight: 5, opacity: 0.9 }).addTo(map);
  map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

  const km = (route.distance / 1000).toFixed(1);
  const min = Math.round(route.duration / 60);
  routeSummary.textContent = `${destLabel} · ${km} km · ~${min} min`;

  routeSteps.innerHTML = '';
  const steps = route.legs?.[0]?.steps || [];
  steps.slice(0, 12).forEach((step) => {
    const li = document.createElement('li');
    const dist = step.distance > 0 ? ` (${Math.round(step.distance)} m)` : '';
    li.textContent = `${step.maneuver?.instruction || 'Continue'}${dist}`;
    routeSteps.appendChild(li);
  });
  if (steps.length > 12) {
    const more = document.createElement('li');
    more.textContent = `… ${steps.length - 12} more steps`;
    routeSteps.appendChild(more);
  }

  routePanel.hidden = false;
  activeRoute = { route, destLabel, coords };
}

async function planRoute() {
  const query = destInput.value.trim();
  if (!query) {
    setStatus('Enter a destination', false);
    return;
  }
  setStatus('Planning route…', true);
  try {
    if (!currentPosition) await refreshLocation();
    const dest = await geocode(query);
    const route = await fetchRoute(currentPosition, dest);
    drawRoute(route, dest.label);
    setStatus('Route ready', true);
  } catch (err) {
    setStatus(err.message || 'Route failed', false);
  }
}

function clearRoute() {
  if (routeLayer) map.removeLayer(routeLayer);
  routeLayer = null;
  activeRoute = null;
  routePanel.hidden = true;
  routeSteps.innerHTML = '';
  routeSummary.textContent = '';
}

function startNavigation() {
  if (!activeRoute) return;
  setStatus('Navigation active — follow route on map', true);
  if (watchId == null) {
    if (Capacitor.isNativePlatform()) {
      Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
        if (err || !pos) return;
        updateUserMarker({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      }).then((id) => {
        watchId = id;
      });
    } else if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) =>
          updateUserMarker({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }
}

document.getElementById('btn-route')?.addEventListener('click', () => planRoute());
document.getElementById('btn-start')?.addEventListener('click', () => startNavigation());
document.getElementById('btn-clear')?.addEventListener('click', () => clearRoute());
destInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') planRoute();
});

initMap();
refreshLocation();
