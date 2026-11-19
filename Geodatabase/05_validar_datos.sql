-- ============================================================
-- ARCHIVO: 05_validar_datos.sql
-- PROYECTO: Visor de Oferta Turística del Quindío
-- ============================================================

-- 1. Conteo de registros por tabla
SELECT 'departamento' AS tabla, COUNT(*) AS total FROM departamento
UNION ALL
SELECT 'municipio', COUNT(*) FROM municipio
UNION ALL
SELECT 'categoria_tur', COUNT(*) FROM categoria_tur
UNION ALL
SELECT 'sitio_turistico', COUNT(*) FROM sitio_turistico;

-- 2. Verificación de SRID y tipos de geometría
SELECT f_table_name, f_geometry_column, type, srid
FROM geometry_columns
WHERE f_table_schema = 'public';

-- 3. Verificación de integridad referencial (Sitios sin municipio asignado)
SELECT s.id_sitio, s.nombre, s."CODMUN_DAN"
FROM sitio_turistico s
LEFT JOIN municipio m ON s."CODMUN_DAN" = m."CODMUN_DAN"
WHERE m."CODMUN_DAN" IS NULL;

-- 4. Prueba de la consulta espacial F3 (Proximidad)
SELECT nombre, 
       ROUND(ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(-75.6833, 4.5333), 4326)::geography)::numeric, 2) AS distancia_m
FROM sitio_turistico
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(-75.6833, 4.5333), 4326)::geography, 5000)
ORDER BY distancia_m
LIMIT 5;