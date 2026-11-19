-- ============================================================
-- ARCHIVO: 02_crear_tablas.sql
-- PROYECTO: Visor de Oferta Turística del Quindío
-- ============================================================

-- TABLA 1: departamento
CREATE TABLE departamento (
    cod_depto VARCHAR(2) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

-- TABLA 2: municipio
CREATE TABLE municipio (
    "CODMUN_DAN" VARCHAR(5) PRIMARY KEY,
    "MPIO_CNMBR" VARCHAR(100) NOT NULL,
    cod_depto VARCHAR(2) NOT NULL,
    geom geometry(MultiPolygon, 4326),
    
    CONSTRAINT fk_municipio_departamento 
        FOREIGN KEY (cod_depto) 
        REFERENCES departamento(cod_depto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- TABLA 3: categoria_tur
CREATE TABLE categoria_tur (
    id_cat SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

-- TABLA 4: sitio_turistico
CREATE TABLE sitio_turistico (
    id_sitio SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria_texto VARCHAR(100),
    id_cat INTEGER,
    "CODMUN_DAN" VARCHAR(5) NOT NULL,
    fuente VARCHAR(150) DEFAULT 'OpenStreetMap (Licencia ODbL)',
    id_origen VARCHAR(100),
    geom geometry(Point, 4326),
    
    CONSTRAINT fk_sitio_municipio 
        FOREIGN KEY ("CODMUN_DAN") 
        REFERENCES municipio("CODMUN_DAN")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_sitio_categoria 
        FOREIGN KEY (id_cat) 
        REFERENCES categoria_tur(id_cat)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Índices espaciales para optimizar consultas (F3 y F4)
CREATE INDEX idx_municipio_geom ON municipio USING GIST (geom);
CREATE INDEX idx_sitio_geom ON sitio_turistico USING GIST (geom);