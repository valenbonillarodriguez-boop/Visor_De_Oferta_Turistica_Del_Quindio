-- ============================================================
-- ARCHIVO: 01_crear_base_datos.sql
-- PROYECTO: Visor de Oferta Turística del Quindío
-- ============================================================

-- 1. Crear la base de datos
CREATE DATABASE visor_turismo_quindio
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Colombia.1252'
    LC_CTYPE = 'Spanish_Colombia.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- NOTA: Después de ejecutar esto, conéctese a la nueva base de datos 
-- en pgAdmin antes de ejecutar los siguientes scripts.

-- 2. Habilitar la extensión espacial PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 3. Verificar instalación
SELECT PostGIS_Version();