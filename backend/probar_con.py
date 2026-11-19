import psycopg
from dotenv import load_dotenv
import os

load_dotenv()

def probar_conexion():
    try:
        conexion = psycopg.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )

        print("✅ Conexión exitosa a PostgreSQL")

        cursor = conexion.cursor()

        cursor.execute("SELECT PostGIS_Version();")
        version_postgis = cursor.fetchone()[0]
        print(f"✅ PostGIS versión: {version_postgis}")

        cursor.execute('SELECT COUNT(*) FROM municipio;')
        total_municipios = cursor.fetchone()[0]
        print(f"✅ Municipios en la tabla: {total_municipios}")

        cursor.execute('SELECT COUNT(*) FROM sitio_turistico;')
        total_sitios = cursor.fetchone()[0]
        print(f"✅ Sitios turísticos en la tabla: {total_sitios}")

        cursor.execute('SELECT nombre FROM categoria_tur ORDER BY id_cat;')
        categorias = cursor.fetchall()
        print("✅ Categorías cargadas:")
        for cat in categorias:
            print(f"   - {cat[0]}")

        cursor.close()
        conexion.close()

        print("\n🎉 ¡Todo funciona correctamente! Puedes continuar con main.py")

    except psycopg.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    probar_conexion()