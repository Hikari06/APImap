import './style.css';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import View from 'ol/View.js';

// Coordenadas do centro de São Paulo em EPSG:3857
const center = [-4650000, -2550000]; // Coordenadas aproximadas em EPSG:3857

// Extensão aproximada para a região de São Paulo em EPSG:3857
const saoPauloExtent = [
  -4650000, -2550000, // coordenadas SW
  -4550000, -2450000  // coordenadas NE
];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(), // Usa a camada base do OpenStreetMap
    }),
  ],
  view: new View({
    projection: 'EPSG:3857', // Projeção Web Mercator
    center: center,          // Centraliza o mapa em São Paulo
    zoom: 10,               // Ajusta o nível de zoom
  }),
});

// Ajusta a visão para garantir que a extensão de São Paulo esteja visível
map.getView().fit(saoPauloExtent, { size: map.getSize(), padding: [50, 50, 50, 50] });
