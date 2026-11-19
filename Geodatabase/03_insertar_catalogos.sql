-- ============================================================
-- ARCHIVO: 03_insertar_catalogos.sql
-- PROYECTO: Visor de Oferta Turística del Quindío
-- ============================================================

-- Insertar departamento
INSERT INTO departamento (cod_depto, nombre) 
VALUES ('63', 'Quindío');

-- Insertar categorías (basadas en la clasificación real de los datos OSM)
INSERT INTO categoria_tur (nombre, descripcion) VALUES
('Mirador', 'Puntos de observación paisajística y viewpoints'),
('Museo o Cultura', 'Museos, centros culturales y sitios patrimoniales'),
('Finca Cafetera o Tour', 'Fincas cafeteras, tours y experiencias cafeteras'),
('Parque o Naturaleza', 'Parques, reservas naturales, bosques y senderos'),
('Monumento o Religioso', 'Monumentos, estatuas, templos y sitios religiosos'),
('Atractivo General', 'Otros atractivos turísticos no clasificados en las categorías anteriores');