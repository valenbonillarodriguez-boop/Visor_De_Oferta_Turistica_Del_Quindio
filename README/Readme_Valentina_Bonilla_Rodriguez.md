# Visor de Oferta Turística del Quindío

## 1. Objetivo y alcance

Desarrollar una aplicación SIG Web que permita visualizar, consultar e interactuar con información geográfica de los atractivos turísticos del departamento del Quindío.

El proyecto integra un frontend desarrollado con HTML, CSS, JavaScript y Leaflet; un backend construido con Python y FastAPI; y una geodatabase espacial implementada en PostgreSQL con la extensión PostGIS.

La aplicación se desarrolla en el marco de la Tarea Integradora de la asignatura **Programación para SIG**, aplicando conceptos de desarrollo web, gestión de bases de datos espaciales y análisis geográfico.

## 2. Fuentes de información

| Información | Fuente | Descripción |
|---|---|---|
| Marco territorial municipal | Lineabase (compilación DANE/IGAC) | División político-administrativa de los municipios del Quindío. |
| Atractivos turísticos | OpenStreetMap (OSM) | Información geográfica de sitios turísticos obtenida mediante consultas en Overpass Turbo. |

**Sistema de referencia espacial:** EPSG:4326 (WGS 84).

Los datos turísticos fueron descargados, revisados, validados espacialmente en QGIS y clasificados temáticamente para su incorporación a la geodatabase.

## 3. Arquitectura de la aplicación

La solución implementa una arquitectura cliente-servidor compuesta por tres elementos principales:

### 3.1. Frontend
Interfaz web desarrollada mediante:
- HTML5: estructura de la aplicación.
- CSS3: diseño y presentación visual.
- JavaScript: lógica e interactividad.
- Leaflet: visualización y consulta de información geográfica.

### 3.2. Backend
Servicios web desarrollados con:
- Python: lenguaje de programación.
- FastAPI: construcción de la API y gestión de solicitudes HTTP.
- Psycopg: conexión y comunicación con PostgreSQL.

### 3.3. Geodatabase
Base de datos espacial implementada con:
- PostgreSQL: sistema de gestión de bases de datos.
- PostGIS: extensión para el almacenamiento, consulta y procesamiento de información geográfica.

## 4. Modelo relacional de la geodatabase

La geodatabase está conformada por cuatro tablas relacionadas, diseñadas para organizar la información y garantizar la integridad referencial.

| Tabla | Clave primaria | Descripción |
|---|---|---|
| departamento | `cod_depto` | Almacena la información del departamento del Quindío. |
| municipio | `CODMUN_DAN` | Contiene los 12 municipios del departamento y sus geometrías tipo MultiPolygon. |
| categoria_tur | `id_cat` | Catálogo normalizado de categorías de atractivos turísticos. |
| sitio_turistico | `id_sitio` | Almacena los atractivos turísticos, sus atributos y geometrías tipo Point. |

**Relaciones principales:**
- `departamento` se relaciona con `municipio` mediante `cod_depto`.
- `municipio` se relaciona con `sitio_turistico` mediante `CODMUN_DAN`.
- `categoria_tur` se relaciona con `sitio_turistico` mediante `id_cat`.

Las tablas espaciales utilizan el sistema de referencia EPSG:4326. La tabla `sitio_turistico` también incorpora campos de trazabilidad como `fuente` e `id_origen`.

## 5. Requisitos e instalación

### 5.1. Requisitos de software

- PostgreSQL 12 o superior.
- PostGIS 3.0 o superior.
- Python 3.8 o superior.
- QGIS (opcional, para revisión y validación de información geográfica).
- Visual Studio Code (recomendado).
- Navegador web actualizado.

### 5.2. Dependencias de Python

Las principales dependencias utilizadas son:

- `fastapi`
- `uvicorn`
- `psycopg`
- `python-dotenv`

### 5.3. Configuración de variables de entorno

Crear un archivo `.env` dentro de la carpeta `backend/` con las credenciales de conexión a PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nombre_base_datos
DB_USER=usuario
DB_PASSWORD=contraseña
```

**Importante:** El archivo `.env` contiene información privada de conexión y no debe publicarse en GitHub. Se recomienda incluirlo en el archivo `.gitignore`.

## 6. Instrucciones de ejecución

### 6.1. Configuración de la base de datos

1. Instalar PostgreSQL y habilitar la extensión PostGIS.
2. Crear la base de datos del proyecto.
3. Abrir pgAdmin o la consola de PostgreSQL.
4. Ejecutar los scripts SQL ubicados en `geodatabase/sql/`, respetando el orden numérico del 01 al 05.
5. Verificar la creación de las tablas, relaciones y registros.

### 6.2. Ejecución del backend

Abrir una terminal en la carpeta raíz del proyecto y ejecutar:

```bash
cd backend
python -m venv venv
```

Activar el entorno virtual:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

Iniciar el servidor:

```bash
uvicorn main:app --reload
```

La API estará disponible en:

`http://127.0.0.1:8000`

### 6.3. Ejecución del frontend

Abrir una segunda terminal, sin cerrar la terminal del backend, y ejecutar:

```bash
cd frontend
python -m http.server 8080
```

Abrir el navegador e ingresar a:

`http://localhost:8080`

**Nota:** No se recomienda abrir directamente el archivo `index.html` mediante doble clic, utilizando el protocolo `file://`, debido a las restricciones de seguridad del navegador para las solicitudes `fetch`. El frontend debe ejecutarse mediante un servidor local.

## 7. Funcionalidades implementadas y endpoints

La aplicación cuenta con cuatro funcionalidades principales y un endpoint auxiliar para la consulta de categorías.

| Funcionalidad | Endpoint | Método | Descripción | Operación PostGIS / SQL |
|---|---|---|---|---|
| F1. Visualización geográfica | `/municipios` | GET | Consulta y visualización de los 12 polígonos municipales en Leaflet. | `ST_AsGeoJSON(geom)` |
| F2a. Búsqueda de sitios | `/sitios/buscar?texto=` | GET | Búsqueda de atractivos turísticos mediante coincidencias parciales en sus nombres. | `ILIKE` |
| F2b. Detalle de sitio | `/sitios/{id}` | GET | Consulta de los atributos completos de un atractivo turístico. | `JOIN` entre tablas |
| F3. Consulta espacial de proximidad | `/consultas/proximidad?lon=&lat=&radio=` | GET | Identificación de sitios turísticos dentro de un radio determinado desde un punto seleccionado en el mapa. | `ST_DWithin` y `ST_Distance` |
| F4. Densidad turística | `/consultas/densidad` | GET | Cálculo de la cantidad de sitios turísticos por kilómetro cuadrado en cada municipio. | `ST_Area`, `COUNT` y `LEFT JOIN` |
| Auxiliar. Categorías | `/categorias` | GET | Consulta de las categorías disponibles para el selector del frontend. | `SELECT` |

### 7.1. Justificación técnica de las operaciones espaciales

**F3. Consulta de proximidad**

Se utiliza para identificar los atractivos turísticos que se encuentran dentro de una distancia determinada respecto a un punto de referencia.

- Geometría: Point.
- Sistema de referencia: EPSG:4326.
- Operaciones: `ST_MakePoint`, `ST_SetSRID`, `ST_DWithin` y `ST_Distance`.
- Unidades de distancia: metros.
- Conversión espacial: casteo `::geography`.

El uso de `geography` permite realizar los cálculos de distancia considerando la curvatura terrestre, en lugar de interpretar las coordenadas geográficas como unidades planas.

**Orden de coordenadas:** PostGIS utiliza `[longitud, latitud]`, mientras que Leaflet maneja `[latitud, longitud]`. Por esta razón, se realiza la conversión correspondiente entre ambas estructuras.

**F4. Densidad turística**

Permite calcular la concentración de atractivos turísticos en cada municipio.

- Geometría municipal: MultiPolygon.
- Geometría de atractivos: Point.
- Sistema de referencia: EPSG:4326.
- Operaciones: `ST_Area`, `COUNT` y `LEFT JOIN`.
- Unidad de superficie: kilómetros cuadrados.

El área se obtiene mediante `ST_Area(geom::geography)` y se convierte de metros cuadrados a kilómetros cuadrados dividiendo entre 1.000.000.

La densidad se calcula mediante la relación entre el número de atractivos turísticos y el área del municipio:

**Densidad turística = Número de sitios turísticos / Área municipal (km²)**

Se utiliza `NULLIF(area_km2, 0)` para evitar divisiones por cero.

## 8. Demostración funcional documentada

Se documenta el funcionamiento de la **F3. Consulta espacial de proximidad**, debido a que integra la interacción del usuario, el frontend, el backend, la conexión con la geodatabase y las operaciones espaciales de PostGIS.

### Secuencia de funcionamiento

1. **Interacción del usuario:** Se activa la herramienta «Sitios Cercanos», se establece un radio de búsqueda (por ejemplo, 1.000 metros) y se selecciona un punto en el mapa.

2. **Captura del evento en el frontend:** Leaflet detecta el evento `click` y obtiene las coordenadas geográficas mediante `e.latlng.lat` y `e.latlng.lng`.

3. **Construcción de la solicitud:** JavaScript construye la URL con los parámetros de longitud, latitud y radio de búsqueda.

   Ejemplo:

   ```text
   /consultas/proximidad?lon=-75.57&lat=4.63&radio=1000
   ```

4. **Petición HTTP:** Se ejecuta una solicitud mediante `fetch()` utilizando el método GET.

5. **Recepción en el backend:** FastAPI identifica el endpoint `/consultas/proximidad` y recibe los parámetros enviados desde el frontend.

6. **Consulta en la geodatabase:** Mediante Psycopg se ejecuta una consulta SQL parametrizada en PostgreSQL/PostGIS. Se construye el punto de referencia con `ST_MakePoint` y `ST_SetSRID`, se aplica `ST_DWithin` para filtrar los sitios dentro del radio y `ST_Distance` para calcular las distancias.

7. **Construcción de la respuesta:** FastAPI organiza los resultados en una estructura GeoJSON tipo `FeatureCollection`, incluyendo los atributos de cada sitio y su distancia en metros.

8. **Representación cartográfica:** El frontend recibe la respuesta y Leaflet representa el círculo de búsqueda mediante `L.circle` y los atractivos encontrados mediante `L.geoJSON`. Los elementos incluyen ventanas emergentes con información del nombre, categoría, municipio y distancia.

### Verificación del funcionamiento

La ejecución puede verificarse desde las herramientas de desarrollador del navegador:

1. Presionar F12.
2. Ingresar a la pestaña Network.
3. Ejecutar una consulta de proximidad.
4. Identificar la solicitud `GET /consultas/proximidad`.
5. Comprobar que la respuesta HTTP tenga estado `200 OK`.
6. Revisar el contenido GeoJSON devuelto por la API.

## 9. Procedimiento para la obtención de los datos

### 9.1. Marco territorial: municipios del Quindío

Fuente: [Lineabase – Shapefile de municipios de Colombia](https://lineabase.com.co/shape-municipios-colombia/).

Procedimiento:

1. Ingresar al portal de Lineabase.
2. Descargar el shapefile nacional de división político-administrativa municipal.
3. Abrir la información geográfica en QGIS.
4. Aplicar un filtro mediante el campo `DPTO_CCDGO = '63'`, correspondiente al departamento del Quindío.
5. Exportar los 12 municipios como una capa independiente.
6. Verificar que el sistema de referencia espacial corresponda a EPSG:4326.

### 9.2. Atractivos turísticos

Fuente: [OpenStreetMap – Overpass Turbo](https://overpass-turbo.eu/).

Procedimiento:

1. Ingresar a Overpass Turbo.
2. Ejecutar una consulta espacial delimitada al departamento del Quindío.
3. Utilizar etiquetas relacionadas con turismo, patrimonio histórico, elementos naturales y espacios recreativos, como `tourism`, `historic`, `natural=peak` y `leisure`.
4. Exportar los resultados en formato GeoJSON.
5. Abrir los datos en QGIS.
6. Verificar y, si es necesario, transformar el sistema de referencia a EPSG:4326.
7. Revisar, depurar y clasificar temáticamente los atractivos turísticos.
8. Incorporar la información validada a la geodatabase.

### 9.3. Licencia de los datos turísticos

Los datos obtenidos de OpenStreetMap se encuentran publicados bajo la licencia **Open Database License (ODbL)**.

Esta licencia permite utilizar, modificar y redistribuir los datos, respetando las condiciones de atribución y distribución establecidas.

Se debe:

- Reconocer la fuente: © OpenStreetMap contributors.
- Incluir la referencia a la licencia ODbL.
- Cumplir las condiciones de compartición aplicables a las bases de datos derivadas.

Para garantizar la trazabilidad, el proyecto conserva en la tabla `sitio_turistico` el campo `fuente`, identificando el origen de los datos.

## 10. Autor

**Valentina Bonilla Rodríguez**

Ingeniería Topográfica y Geomática  
Universidad del Quindío  
Asignatura: Programación para SIG  
Año: 2026