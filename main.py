from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import sqlite3
import os

app = Flask(__name__)

# Folder setup
PERM_UPLOAD_FOLDER = 'uploads'
app.config['PERM_UPLOAD_FOLDER'] = PERM_UPLOAD_FOLDER
os.makedirs(PERM_UPLOAD_FOLDER, exist_ok=True)

# Database init
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

        conn.execute('''CREATE TABLE IF NOT EXISTS replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pin_id INTEGER,
            username TEXT,
            message TEXT,
            FOREIGN KEY (pin_id) REFERENCES pins(id)
        )''')

#main Routes
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/maps')
def maps():
    return render_template("maps.html")

@app.route('/ai', methods=['GET', 'POST'])
def ai():
    output_text = None

    if request.method == 'POST':
        user_text = request.form.get('user_text')
        image_file = request.files.get('image_file')

        # For now, just confirm text received and image filename (no saving needed)
        image_name = image_file.filename if image_file else 'No image uploaded'

        output_text = f"Hello World! You sent text: '{user_text}' and image filename: '{image_name}'"

    return render_template('ai.html', output_text=output_text)


#additional functions
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
        file.save(os.path.join(app.config['PERM_UPLOAD_FOLDER'], filename))

    with sqlite3.connect("database.db") as conn:
        conn.execute("INSERT INTO pins (lat, lng, review, image, rating) VALUES (?, ?, ?, ?, ?)",
                     (lat, lng, review, filename, rating))

    return jsonify({"status": "success"})

# Get pins
@app.route('/maps/get_pins')
def get_pins():
    with sqlite3.connect("database.db") as conn:
        pins = conn.execute("SELECT lat, lng, review, rating, image FROM pins").fetchall()
    return jsonify(pins)

@app.route('/maps/add_reply', methods=['POST'])
def add_reply():
    pin_id = request.form['pin_id']
    username = request.form['username']
    message = request.form['message']

    with sqlite3.connect("database.db") as conn:
        conn.execute(
            "INSERT INTO replies (pin_id, username, message) VALUES (?, ?, ?)",
            (pin_id, username, message)
        )

    return jsonify({"status": "success"})

@app.route('/maps/get_replies/<int:pin_id>')
def get_replies(pin_id):
    with sqlite3.connect("database.db") as conn:
        replies = conn.execute(
            "SELECT username, message FROM replies WHERE pin_id = ?",
            (pin_id,)
        ).fetchall()

    return jsonify(replies)

# Serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['PERM_UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
