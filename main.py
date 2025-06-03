from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import sqlite3
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# DB Init
def init_db():
    with sqlite3.connect("database.db") as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS pins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL,
            lng REAL,
            review TEXT,
            rating REAL,
            image TEXT
        )''')

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/maps')
def maps():
    return render_template("maps.html")

@app.route('/maps/add_pin', methods=['POST'])
def add_pin():
    lat = float(request.form['lat'])
    lng = float(request.form['lng'])
    review = request.form['review']
    rating = request.form['rating']
    file = request.files.get('image')
    filename = ""

    if file and file.filename:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    with sqlite3.connect("database.db") as conn:
        conn.execute("INSERT INTO pins (lat, lng, review, image, rating) VALUES (?, ?, ?, ?, ?)", (lat, lng, review, filename, rating))

    return jsonify({"status": "success"})

@app.route('/maps/get_pins')
def get_pins():
    with sqlite3.connect("database.db") as conn:
        pins = conn.execute("SELECT lat, lng, review, rating , image FROM pins").fetchall()
    return jsonify(pins)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    init_db()
    app.run(debug=True)