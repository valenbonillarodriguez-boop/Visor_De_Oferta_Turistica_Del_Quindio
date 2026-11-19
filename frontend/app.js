// ============================================================
// ARCHIVO: app.js
// PROYECTO: Visor Turismo Quindío
// DESCRIPCIÓN: Lógica del frontend conectado al backend FastAPI
// ============================================================

// URL base del backend (FastAPI)
const API_URL = 'http://127.0.0.1:8000';

// ============================================================
// INICIALIZACIÓN DEL MAPA
// ============================================================

// Crear el mapa centrado en el Quindío
const map = L.map('map').setView([4.5333, -75.6833], 10);

// Agregar capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Variables globales para las capas
let capaMunicipios = null;
let capaProximidad = null;
let capaDensidad = null;
let modoProximidadActivo = false;

// ============================================================
// F1: VISUALIZACIÓN DE MUNICIPIOS (Carga automática)
// ============================================================

async function cargarMunicipios() {
    try {
        const respuesta = await fetch(`${API_URL}/municipios`);
        
        if (!respuesta.ok) {
            throw new Error('Error al cargar municipios');
        }
        
        const datos = await respuesta.json();
        
        console.log('✅ Municipios recibidos:', datos);
        
        capaMunicipios = L.geoJSON(datos, {
            style: {
                color: '#2E7D32',
                weight: 2,
                fillColor: '#4CAF50',
                fillOpacity: 0.3
            },
            onEachFeature: function(feature, layer) {
                const popup = `
                    <h3>${feature.properties.nombre}</h3>
                    <p><strong>Código DANE:</strong> ${feature.properties.cod_muni}</p>
                `;
                layer.bindPopup(popup);
                
                layer.on('mouseover', function() {
                    this.setStyle({
                        fillOpacity: 0.5,
                        weight: 3
                    });
                });
                
                layer.on('mouseout', function() {
                    this.setStyle({
                        fillOpacity: 0.3,
                        weight: 2
                    });
                });
            }
        }).addTo(map);
        
        console.log('✅ Municipios cargados correctamente');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al cargar los municipios. Verifique que el backend esté ejecutándose.');
    }
}

// Cargar municipios automáticamente al abrir la página
cargarMunicipios();

// ============================================================
// F2-A: BÚSQUEDA DE SITIOS TURÍSTICOS
// ============================================================

async function buscarSitios() {
    const texto = document.getElementById('buscar-texto').value.trim();
    
    if (texto.length < 2) {
        alert('Ingrese al menos 2 caracteres para buscar');
        return;
    }
    
    try {
        const respuesta = await fetch(`${API_URL}/sitios/buscar?texto=${encodeURIComponent(texto)}`);
        
        if (!respuesta.ok) {
            throw new Error('Error en la búsqueda');
        }
        
        const datos = await respuesta.json();
        
        console.log('🔍 Resultados de búsqueda:', datos);
        
        const contenedor = document.getElementById('resultados-busqueda');
        
        if (datos.total === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #666;">No se encontraron resultados</p>';
            return;
        }
        
        let html = `<p style="margin-bottom: 10px; color: #1B5E20; font-weight: 600;">${datos.total} sitio(s) encontrado(s):</p>`;
        
        datos.resultados.forEach(sitio => {
            html += `
                <div class="resultado-item" onclick="verDetalleSitio(${sitio.id_sitio})">
                    <strong>${sitio.nombre}</strong>
                    <small>${sitio.categoria_formal} - ${sitio.municipio}</small>
                </div>
            `;
        });
        
        contenedor.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al buscar sitios');
    }
}

// ============================================================
// F2-B: DETALLE DE UN SITIO TURÍSTICO
// ============================================================

async function verDetalleSitio(idSitio) {
    try {
        const respuesta = await fetch(`${API_URL}/sitios/${idSitio}`);
        
        if (!respuesta.ok) {
            throw new Error('Sitio no encontrado');
        }
        
        const datos = await respuesta.json();
        
        console.log('📍 Detalle del sitio:', datos);
        
        const popup = `
            <h3>${datos.nombre}</h3>
            <p><strong>Categoría:</strong> ${datos.categoria_formal}</p>
            <p><strong>Municipio:</strong> ${datos.municipio}</p>
            <p><strong>Fuente:</strong> ${datos.fuente}</p>
        `;
        
        L.popup()
            .setLatLng(map.getCenter())
            .setContent(popup)
            .openOn(map);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al cargar los detalles del sitio');
    }
}

// ============================================================
// F3: CONSULTA ESPACIAL POR PROXIMIDAD
// ============================================================

function activarModoProximidad() {
    modoProximidadActivo = !modoProximidadActivo;
    
    const boton = document.getElementById('btn-proximidad');
    
    if (modoProximidadActivo) {
        boton.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right: 8px;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Desactivar Búsqueda
        `;
        boton.classList.add('active');
        map.getContainer().style.cursor = 'crosshair';
        
        alert('Modo de búsqueda activado. Haga clic en el mapa para buscar sitios cercanos.');
        
        map.on('click', realizarBusquedaProximidad);
        
    } else {
        boton.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="margin-right: 8px;">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Activar Búsqueda
        `;
        boton.classList.remove('active');
        map.getContainer().style.cursor = '';
        
        map.off('click', realizarBusquedaProximidad);
        
        if (capaProximidad) {
            map.removeLayer(capaProximidad);
            capaProximidad = null;
        }
        
        document.getElementById('resultado-proximidad').innerHTML = '';
    }
}

async function realizarBusquedaProximidad(e) {
    if (!modoProximidadActivo) return;
    
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const radio = document.getElementById('radio-proximidad').value;
    
    try {
        const url = `${API_URL}/consultas/proximidad?lon=${lon}&lat=${lat}&radio=${radio}`;
        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw new Error('Error en la búsqueda por proximidad');
        }
        
        const datos = await respuesta.json();
        
        console.log('📡 Resultados de proximidad:', datos);
        
        if (capaProximidad) {
            map.removeLayer(capaProximidad);
        }
        
        capaProximidad = L.layerGroup();
        
        L.circle([lat, lon], {
            radius: parseFloat(radio),
            color: '#4CAF50',
            fillColor: '#4CAF50',
            fillOpacity: 0.2,
            weight: 2
        }).addTo(capaProximidad);
        
        L.circleMarker([lat, lon], {
            radius: 8,
            color: '#2E7D32',
            fillColor: '#2E7D32',
            fillOpacity: 1,
            weight: 2
        }).addTo(capaProximidad);
        
        if (datos.features.length > 0) {
            L.geoJSON(datos, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 10,
                        fillColor: '#FF9800',
                        color: '#F57C00',
                        weight: 2,
                        fillOpacity: 0.9
                    });
                },
                onEachFeature: function(feature, layer) {
                    const popup = `
                        <h3>${feature.properties.nombre}</h3>
                        <p><strong>Distancia:</strong> ${feature.properties.distancia_m} m</p>
                        <p><strong>Categoría:</strong> ${feature.properties.categoria}</p>
                        <p><strong>Municipio:</strong> ${feature.properties.municipio}</p>
                    `;
                    layer.bindPopup(popup);
                }
            }).addTo(capaProximidad);
        }
        
        capaProximidad.addTo(map);
        
        document.getElementById('resultado-proximidad').innerHTML = `
            <p style="color: #1B5E20; font-weight: 600; margin-bottom: 5px;">
                ✅ ${datos.features.length} sitio(s) encontrado(s)
            </p>
            <p style="font-size: 12px; color: #666;">
                en un radio de ${radio} m
            </p>
        `;
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al realizar la búsqueda por proximidad');
    }
}

// ============================================================
// F4: DENSIDAD DE SITIOS TURÍSTICOS POR MUNICIPIO
// ============================================================

async function mostrarDensidad() {
    try {
        const respuesta = await fetch(`${API_URL}/consultas/densidad`);
        
        if (!respuesta.ok) {
            throw new Error('Error al calcular densidad');
        }
        
        const datos = await respuesta.json();
        
        console.log('📊 Datos de densidad:', datos);
        
        if (capaDensidad) {
            map.removeLayer(capaDensidad);
        }
        
        // Rampa de colores verde-amarillo-naranja
        const colores = ['#C8E6C9', '#AED581', '#FFF176', '#FFB74D', '#FF8A65'];
        
        const densidades = datos.features.map(f => f.properties.densidad_sitios_km2 || 0);
        const maxDensidad = Math.max(...densidades);
        const intervalo = maxDensidad / 5 || 1;
        
        capaDensidad = L.geoJSON(datos, {
            style: function(feature) {
                const densidad = feature.properties.densidad_sitios_km2 || 0;
                let colorIndex = Math.floor(densidad / intervalo);
                if (colorIndex >= 5) colorIndex = 4;
                if (colorIndex < 0) colorIndex = 0;
                
                return {
                    fillColor: colores[colorIndex],
                    weight: 2,
                    color: '#2E7D32',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                const props = feature.properties;
                const popup = `
                    <h3>${props.nombre}</h3>
                    <p><strong>Total sitios:</strong> ${props.total_sitios}</p>
                    <p><strong>Área:</strong> ${props.area_km2} km²</p>
                    <p><strong>Densidad:</strong> ${props.densidad_sitios_km2} sitios/km²</p>
                `;
                layer.bindPopup(popup);
            }
        }).addTo(map);
        
        // Construir leyenda
        let leyenda = '<div class="leyenda-densidad">';
        leyenda += '<h4>📊 Densidad Turística</h4>';
        leyenda += '<p style="font-size: 12px; color: #666; margin-bottom: 10px;">Sitios por km²:</p>';
        
        for (let i = 0; i < 5; i++) {
            const min = (i * intervalo).toFixed(2);
            const max = ((i + 1) * intervalo).toFixed(2);
            leyenda += `
                <div class="leyenda-item">
                    <div class="leyenda-color" style="background: ${colores[i]};"></div>
                    <span>${min} - ${max}</span>
                </div>
            `;
        }
        leyenda += '</div>';
        
        document.getElementById('resultado-densidad').innerHTML = leyenda;
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al calcular la densidad');
    }
}

// ============================================================
// MENSAJE DE BIENVENIDA EN CONSOLA
// ============================================================

console.log('====================================');
console.log('🌄 Turismo Quindío');
console.log('Vive la cultura, explora nuestra tierra');
console.log('====================================');
console.log('Desarrollado para Programación para SIG');
console.log('Universidad del Quindío - 2026');
console.log('====================================');