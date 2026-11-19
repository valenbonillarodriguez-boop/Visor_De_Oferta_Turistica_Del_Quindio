from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = FastAPI(
    title="Visor de Oferta Turística del Quindío",
    description="API para consultar atractivos turísticos del Quindío",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def conectar_bd():
    try:
        conexion = psycopg.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        return conexion
    except psycopg.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error de conexión a la base de datos: {e}"
        )

def construir_feature_collection(filas, campo_geom="geom"):
    features = []
    for fila in filas:
        geom_texto = fila.pop(campo_geom, None)
        if geom_texto:
            feature = {
                "type": "Feature",
                "properties": fila,
                "geometry": json.loads(geom_texto)
            }
            features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.get("/")
def raiz():
    return {
        "mensaje": "Visor de Oferta Turística del Quindío - API funcionando",
        "documentacion": "http://127.0.0.1:8000/docs"
    }

@app.get("/municipios")
def obtener_municipios():
    conexion = None
    try:
        conexion = conectar_bd()
        sql = """
            SELECT
                "CODMUN_DAN" AS cod_muni,
                "MPIO_CNMBR" AS nombre,
                cod_depto,
                ST_AsGeoJSON(geom) AS geom
            FROM municipio
            ORDER BY "CODMUN_DAN";
        """
        with conexion.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql)
            filas = cursor.fetchall()

        feature_collection = construir_feature_collection(filas)
        return JSONResponse(content=feature_collection)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion:
            conexion.close()

@app.get("/sitios/buscar")
def buscar_sitios(texto: str = Query(..., min_length=2)):
    conexion = None
    try:
        conexion = conectar_bd()
        sql = """
            SELECT
                s.id_sitio,
                s.nombre,
                s.categoria_texto AS categoria,
                c.nombre AS categoria_formal,
                m."MPIO_CNMBR" AS municipio,
                s.fuente
            FROM sitio_turistico s
            JOIN categoria_tur c ON s.id_cat = c.id_cat
            JOIN municipio m ON s."CODMUN_DAN" = m."CODMUN_DAN"
            WHERE s.nombre ILIKE %s
            ORDER BY s.nombre;
        """
        with conexion.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql, (texto,))
            filas = cursor.fetchall()

        return JSONResponse(content={
            "total": len(filas),
            "resultados": filas
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion:
            conexion.close()

@app.get("/sitios/{id_sitio}")
def obtener_sitio(id_sitio: int):
    conexion = None
    try:
        conexion = conectar_bd()
        sql = """
            SELECT
                s.id_sitio,
                s.nombre,
                s.categoria_texto AS categoria,
                c.nombre AS categoria_formal,
                c.descripcion AS descripcion_categoria,
                m."MPIO_CNMBR" AS municipio,
                m."CODMUN_DAN" AS cod_muni,
                s.fuente,
                s.id_origen
            FROM sitio_turistico s
            JOIN categoria_tur c ON s.id_cat = c.id_cat
            JOIN municipio m ON s."CODMUN_DAN" = m."CODMUN_DAN"
            WHERE s.id_sitio = %s;
        """
        with conexion.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql, (id_sitio,))
            fila = cursor.fetchone()

        if not fila:
            raise HTTPException(
                status_code=404,
                detail=f"No se encontró un sitio con id={id_sitio}"
            )

        return JSONResponse(content=fila)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion:
            conexion.close()

@app.get("/consultas/proximidad")
def sitios_cercanos(
    lon: float = Query(..., description="Longitud del punto central"),
    lat: float = Query(..., description="Latitud del punto central"),
    radio: float = Query(..., gt=0, description="Radio de búsqueda en metros")
):
    conexion = None
    try:
        conexion = conectar_bd()
        sql = """
            SELECT
                s.id_sitio,
                s.nombre,
                s.categoria_texto AS categoria,
                m."MPIO_CNMBR" AS municipio,
                ST_AsGeoJSON(s.geom) AS geom,
                ROUND(
                    ST_Distance(
                        s.geom::geography,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
                    )::numeric,
                    2
                )::float AS distancia_m
            FROM sitio_turistico s
            JOIN municipio m ON s."CODMUN_DAN" = m."CODMUN_DAN"
            WHERE ST_DWithin(
                s.geom::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                %s
            )
            ORDER BY distancia_m;
        """
        with conexion.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql, (lon, lat, lon, lat, radio))
            filas = cursor.fetchall()

        feature_collection = construir_feature_collection(filas)
        feature_collection["metadata"] = {
            "punto_central": {"lon": lon, "lat": lat},
            "radio_metros": radio,
            "total_resultados": len(filas)
        }

        return JSONResponse(content=feature_collection)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion:
            conexion.close()

@app.get("/consultas/densidad")
def densidad_por_municipio():
    conexion = None
    try:
        conexion = conectar_bd()
        sql = """
            SELECT
                m."CODMUN_DAN" AS cod_muni,
                m."MPIO_CNMBR" AS nombre,
                ST_AsGeoJSON(m.geom) AS geom,
                COUNT(s.id_sitio) AS total_sitios,
                ROUND(
                    (ST_Area(m.geom::geography) / 1000000.0)::numeric,
                    2
                )::float AS area_km2,
                ROUND(
                    (
                        COUNT(s.id_sitio) /
                        NULLIF(ST_Area(m.geom::geography) / 1000000.0, 0)
                    )::numeric,
                    4
                )::float AS densidad_sitios_km2
            FROM municipio m
            LEFT JOIN sitio_turistico s
                ON s."CODMUN_DAN" = m."CODMUN_DAN"
            GROUP BY m."CODMUN_DAN", m."MPIO_CNMBR", m.geom
            ORDER BY densidad_sitios_km2 DESC NULLS LAST;
        """
        with conexion.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql)
            filas = cursor.fetchall()

        feature_collection = construir_feature_collection(filas)
        return JSONResponse(content=feature_collection)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion:
            conexion.close()

@app.get("/categorias")
def obtener_categorias():
    conexion = None
    try:
        conexion = conectar_bd()
        sql = """
            SELECT id_cat, nombre, descripcion
            FROM categoria_tur
            ORDER BY nombre;
        """
        with conexion.cursor(row_factory=dict_row) as cursor:
            cursor.execute(sql)
            filas = cursor.fetchall()

        return JSONResponse(content=filas)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion:
            conexion.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)