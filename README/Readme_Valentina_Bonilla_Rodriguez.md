# Visor de Oferta Turística del Quindío

## 1. Objetivo y Alcance
Desarrollar una aplicación SIG Web que permita visualizar, consultar e interactuar con información geográfica de atractivos turísticos del departamento del Quindío. El proyecto integra un frontend (HTML, CSS, JS, Leaflet), un backend (Python, FastAPI) y una geodatabase espacial (PostgreSQL/PostGIS), cumpliendo con los requisitos de la Tarea Integradora de la asignatura Programación para SIG.

## 2. Fuentes de Información
* **Marco Territorial (Municipios):** División político-administrativa municipal de Colombia. Fuente: Lineabase (compilación oficial DANE/IGAC). Sistema de Referencia: EPSG:4326 (WGS 84).
* **Atractivos Turísticos (Puntos):** OpenStreetMap (OSM) mediante consulta espacial en Overpass Turbo. Licencia: ODbL (Open Database License). Los datos fueron filtrados, validados espacialmente en QGIS y clasificados temáticamente.

## 3. Arquitectura de la Aplicación
La solución implementa una arquitectura cliente-servidor:
* **Frontend:** Interfaz web desarrollada con HTML5, CSS3, JavaScript y la librería Leaflet para la representación cartográfica.
* **Backend/API:** Servicios web construidos con Python y FastAPI, que actúan como intermediario entre el visor y la base de datos.
* **Geodatabase:** PostgreSQL con la extensión espacial PostGIS, encargada del almacenamiento, integridad referencial y ejecución de operaciones espaciales.
* **Conexión:** Librería `psycopg` para la comunicación segura entre Python y PostgreSQL.

## 4. Modelo Relacional
La geodatabase contiene 4 tablas relacionadas, garantizando la integridad referencial:
1. **departamento:** (PK: cod_depto). Contiene el registro del Quindío.
2. **municipio:** (PK: CODMUN_DAN, FK: cod_depto). 12 registros con geometrías MultiPolygon (EPSG:4326).
3. **categoria_tur:** (PK: id_cat). Catálogo normalizado de tipos de atractivos (ej. Mirador, Museo, Finca Cafetera).
4. **sitio_turistico:** (PK: id_sitio, FK: CODMUN_DAN, FK: id_cat). Entidad central con geometrías Point (EPSG:4326) y campos de trazabilidad (fuente, id_origen).

## 5. Requisitos e Instalación
* **Software:** PostgreSQL 12+ con PostGIS 3.0+, Python 3.8+, QGIS (opcional para revisión de datos).
* **Dependencias Python:** `fastapi`, `uvicorn`, `psycopg`, `python-dotenv`.
* **Configuración:** Crear un archivo `.env` en la carpeta `backend/` con las credenciales de PostgreSQL (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD). **Nunca subir este archivo a GitHub.**

## 6. Instrucciones de Ejecución
1. **Base de Datos:** Ejecutar los scripts de la carpeta `geodatabase/sql/` en orden (01 a 05) en pgAdmin.
2. **Backend:** 
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload