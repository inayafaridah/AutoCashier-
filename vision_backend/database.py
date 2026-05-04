import mysql.connector
from mysql.connector import Error

class Database:
    def __init__(self, host='localhost', user='root', password='', database='kantin_db'):
        self.config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database
        }

    def get_connection(self):
        try:
            connection = mysql.connector.connect(**self.config)
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return None

    def get_product_by_label(self, label):
        connection = self.get_connection()
        if not connection:
            return None
        
        try:
            cursor = connection.cursor(dictionary=True)
            query = "SELECT nama, label_yolo, harga FROM produk WHERE label_yolo = %s"
            cursor.execute(query, (label,))
            result = cursor.fetchone()
            return result
        except Error as e:
            print(f"Error fetching product: {e}")
            return None
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()

# SQL for Table Creation
# CREATE DATABASE IF NOT EXISTS kantin_db;
# USE kantin_db;
# CREATE TABLE produk (
#     id INT AUTO_INCREMENT PRIMARY KEY,
#     nama VARCHAR(100) NOT NULL,
#     label_yolo VARCHAR(50) UNIQUE NOT NULL,
#     harga INT NOT NULL
# );
# INSERT INTO produk (nama, label_yolo, harga) VALUES ('Teh Botol', 'teh_botol', 5000), ('Aqua 600ml', 'aqua', 3500);
