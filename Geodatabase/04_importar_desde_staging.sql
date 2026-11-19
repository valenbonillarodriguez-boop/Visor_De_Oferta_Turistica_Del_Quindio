-- ============================================================
-- ARCHIVO: 04_importar_desde_staging.sql
-- PROYECTO: Visor de Oferta Turística del Quindío
-- INSTRUCCIONES DE CARGA:
-- 1. Importar el shapefile de municipios en QGIS DB Manager 
--    hacia la tabla 'stg_municipios'.
-- 2. Importar el shapefile de sitios turísticos en QGIS DB Manager 
--    hacia la tabla 'stg_sitios_turisticos'.
-- 3. Ejecutar este script para limpiar y pasar los datos a las tablas finales.
-- ============================================================

-- Limpiar tablas finales antes de recargar (para evitar duplicados)
TRUNCATE TABLE sitio_turistico RESTART IDENTITY CASCADE;
TRUNCATE TABLE municipio RESTART IDENTITY CASCADE;

-- Insertar municipios desde staging (asegurando MultiPolygon y SRID 4326)
INSERT INTO municipio ("CODMUN_DAN", "MPIO_CNMBR", cod_depto, geom)
SELECT 
    TRIM(cod_muni) AS cod_muni,
    INITCAP(TRIM(nombre_muni)) AS nombre_municipio,
    TRIM(cod_depto) AS cod_depto,
    ST_Multi(ST_SetSRID(geom, 4326))::geometry(MultiPolygon, 4326) AS geom
FROM stg_municipios
WHERE cod_muni ~ '^63[0-9]{3}$' AND geom IS NOT NULL;

-- Asignar el id_cat a los sitios turísticos basándose en el texto de la categoría
UPDATE sitio_turistico s
SET id_cat = c.id_cat
FROM categoria_tur c
WHERE s.categoria_texto = c.nombre;

-- (Nota: La inserción de sitios turísticos desde staging se realiza 
-- mediante QGIS DB Manager mapeando los campos directamente a la tabla 
-- 'sitio_turistico' para garantizar la integridad de las geometrías Point).