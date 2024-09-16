import './style.css';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import View from 'ol/View.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Style, Icon } from 'ol/style.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';

// Coordenadas iniciais para centralizar o mapa
const center = fromLonLat([-46.6333, -23.5505]); // São Paulo

const vectorSource = new VectorSource();

const vectorLayer = new VectorLayer({
  source: vectorSource,
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

let lastClickedCoordinate = null; // Variável para armazenar a última coordenada clicada

// Função para adicionar o ícone no local do clique
function addMarker(coordinate) {
  const marker = new Feature({
    geometry: new Point(coordinate),
  });

  marker.setStyle(new Style({
    image: new Icon({
      anchor: [0.5, 1],
      src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Ícone padrão para o marcador
      scale: 0.05, // Ajusta o tamanho do ícone
    }),
  }));

  vectorSource.clear(); // Limpa qualquer marcador existente
  vectorSource.addFeature(marker); // Adiciona o novo marcador

  // Atualiza a última coordenada clicada
  lastClickedCoordinate = coordinate;
}

// Evento de clique no mapa
map.on('click', function (event) {
  const coordinate = event.coordinate; // Coordenadas em EPSG:3857
  const lonLat = toLonLat(coordinate); // Converte para EPSG:4326 (longitude, latitude)
  const latitude = lonLat[1].toFixed(5); // Latitude com 5 casas decimais
  const longitude = lonLat[0].toFixed(5); // Longitude com 5 casas decimais

  // Adiciona o ícone no local clicado
  addMarker(coordinate);

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
      console.log('Local não encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar a localização:', error);
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

// Função para buscar o nome do local a partir da coordenada (geocodificação reversa)
async function reverseGeocode(coordinate) {
  const lonLat = toLonLat(coordinate);
  const lat = lonLat[1];
  const lon = lonLat[0];

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
    const data = await response.json();
    return data.address; // Retorna o endereço completo
  } catch (error) {
    console.error('Erro ao obter o endereço:', error);
    return null;
  }
}

// Função para salvar a localização atual
async function saveLocation() {
  if (lastClickedCoordinate) {
    const address = await reverseGeocode(lastClickedCoordinate);

    if (address) {
      const street = address.road || 'Rua não identificada';
      const suburb = address.suburb || 'Bairro não identificado';
      const city = address.city || address.town || 'Cidade não identificada';
      const place = address.display_name || 'Local não identificado';

      // Adiciona um card com a localização salva na div sugestao
      const suggestionDiv = document.querySelector('.sugestao');
      const newCard = document.createElement('div');
      newCard.className = 'card';
      newCard.innerText = `Local salvo: ${street}, ${suburb}, ${city} (${place})`;
      suggestionDiv.appendChild(newCard);
    } else {
      alert('Endereço não encontrado para essa localização.');
    }
  } else {
    alert("Clique no mapa para selecionar uma localização primeiro.");
  }
}

// Adiciona o evento de clique ao botão para salvar a localização
document.getElementById('save-btn').addEventListener('click', saveLocation);
