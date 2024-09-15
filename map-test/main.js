import './style.css';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import View from 'ol/View.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Fill, Stroke } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';

// Coordenadas iniciais para centralizar o mapa
const center = fromLonLat([-46.6333, -23.5505]); // São Paulo

const vectorSource = new VectorSource();

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    fill: new Fill({
      color: 'rgba(233, 189, 192, 0.5)', // Cor rosa com opacidade
    }),
    stroke: new Stroke({
      color: '#ff69b4', // Cor da borda rosa
      width: 2,
    }),
  }),
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(), // Camada base do OpenStreetMap
    }),
    vectorLayer, // Adiciona a camada vetorial ao mapa
  ],
  view: new View({
    projection: 'EPSG:3857', // Projeção Web Mercator
    center: center,          // Centraliza o mapa em São Paulo
    zoom: 12,               // Ajusta o nível de zoom para São Paulo
  }),
});

// Atualiza as coordenadas no elemento HTML conforme o mouse se move
map.on('pointermove', function(event) {
  const coordinate = event.coordinate; // Coordenadas em EPSG:3857
  const lonLat = toLonLat(coordinate); // Converte para EPSG:4326 (longitude, latitude)
  const latitude = lonLat[1].toFixed(5); // Latitude com 5 casas decimais
  const longitude = lonLat[0].toFixed(5); // Longitude com 5 casas decimais

  // Atualiza o texto das coordenadas
  document.getElementById('coordinates').innerText = `Latitude: ${latitude}, Longitude: ${longitude}`;
});

// Função para buscar e centralizar o mapa em uma localização
async function searchLocation(query) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
    const data = await response.json();
    
    const result = data[0];
    if (result) {
      const lonLat = [parseFloat(result.lon), parseFloat(result.lat)];
      const coordinate = fromLonLat(lonLat);

      // Limpa a camada vetorial
      vectorSource.clear();

      // Adiciona o marcador na nova posição
      vectorSource.addFeature(new Feature({
        geometry: new Point(coordinate)
      }));

      // Centraliza o mapa na nova posição
      map.getView().animate({
        center: coordinate,
        duration: 1000
      });

      // Atualiza os controles deslizantes e o texto das coordenadas
      document.getElementById('lat-range').value = result.lat;
      document.getElementById('lon-range').value = result.lon;
      document.getElementById('lat-value').innerText = result.lat;
      document.getElementById('lon-value').innerText = result.lon;
    } else {
      console.log('Location not found');
    }
  } catch (error) {
    console.error('Error fetching location:', error);
  }
}

// Adiciona o listener para o campo de pesquisa para busca em tempo real
let searchTimeout;
document.getElementById('search').addEventListener('input', function() {
  const query = this.value;
  
  // Limita o número de chamadas à API usando um timeout
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (query) {
      searchLocation(query);
    }
  }, 500); // Espera 500 ms após a última entrada antes de buscar
});

// Atualiza as coordenadas dos controles deslizantes
document.getElementById('lat-range').addEventListener('input', function() {
  const lat = this.value;
  document.getElementById('lat-value').innerText = lat;
  const lon = document.getElementById('lon-range').value;
  const coordinate = fromLonLat([lon, lat]);
  map.getView().animate({
    center: coordinate,
    duration: 500
  });
});

document.getElementById('lon-range').addEventListener('input', function() {
  const lon = this.value;
  document.getElementById('lon-value').innerText = lon;
  const lat = document.getElementById('lat-range').value;
  const coordinate = fromLonLat([lon, lat]);
  map.getView().animate({
    center: coordinate,
    duration: 500
  });
});
