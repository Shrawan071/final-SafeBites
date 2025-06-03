const map = L.map('map').setView([27.7172, 85.3240], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

map.locate({ setView: true, maxZoom: 16 });

map.on('locationfound', e => {
    L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
});

map.on('click', function(e) {
    const formHTML = `
        <form id="pinForm" enctype="multipart/form-data">
            <textarea name="review" rows="3" cols="20" placeholder="Write a review..."></textarea><br>
            <label>Rating:</label>
            <select name="rating">
                <option value="1">⭐</option>
                <option value="2">⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
            </select><br>
            <input type="file" name="image" accept="image/*"><br>
            <input type="hidden" name="lat" value="${e.latlng.lat}">
            <input type="hidden" name="lng" value="${e.latlng.lng}">
            <button type="submit">Submit</button>
        </form>
    `;
    const popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(formHTML)
        .openOn(map);

    document.getElementById("pinForm").onsubmit = function(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        fetch("/maps/add_pin", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(() => {
            map.closePopup();
            loadPins(); // refresh pins
        });
    };
});

function loadPins() {
    fetch('/maps/get_pins')
        .then(res => res.json())
        .then(pins => {
            pins.forEach(([lat, lng, review, rating, image]) => {
                let content = `<b>Review:</b> ${review}<br><b>Rating:</b> ${'⭐'.repeat(rating)}<br>`;
                if (image) {
                    content += `<img src="/uploads/${image}" width="100"/>`;
                }
                L.marker([lat, lng]).addTo(map).bindPopup(content);
            });
        });
}

loadPins();
