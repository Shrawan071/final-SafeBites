const map = L.map('map').setView([27.7172, 85.3240], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

map.locate({ setView: true, maxZoom: 16 });

map.on('locationfound', e => {
    L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
});

// When map is clicked, show form
map.on('click', function(e) {
    const formHTML = `
        <form id="pinForm" enctype="multipart/form-data" style="display:flex; flex-direction:column; gap:6px; font-size:14px">
            <label><b>Review:</b></label>
            <textarea name="review" rows="3" placeholder="Write a review..." required style="padding:4px"></textarea>

            <label><b>Rating:</b></label>
            <select name="rating" required style="padding:4px">
                <option value="1">⭐</option>
                <option value="2">⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
            </select>

            <label><b>Upload Image:</b></label>
            <input type="file" name="image" accept="image/*" style="padding:4px">

            <input type="hidden" name="lat" value="${e.latlng.lat}">
            <input type="hidden" name="lng" value="${e.latlng.lng}">

            <button type="submit" style="background:#007BFF; color:white; padding:6px; border:none; border-radius:4px; margin-top:5px">Submit</button>
        </form>
    `;
    const popup = L.popup().setLatLng(e.latlng).setContent(formHTML).openOn(map);

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
            loadPins();
        });
    };
});

// Load all pins and add replies
function loadPins() {
    fetch('/maps/get_pins')
        .then(res => res.json())
        .then(pins => {
            map.eachLayer(layer => {
                if (layer instanceof L.Marker && !layer._popup?._content?.includes("You are here")) {
                    map.removeLayer(layer);
                }
            });

            pins.forEach(([lat, lng, review, rating, image], i) => {
                const pinId = i + 1; // Assume order maps to DB ID
                let content = `
                    <b>Review:</b> ${review}<br>
                    <b>Rating:</b> ${'⭐'.repeat(rating)}<br>
                `;
                if (image) {
                    content += `<img src="/uploads/${image}" width="120" style="margin-top:5px"><br>`;
                }

                content += `
                    <div id="replies-${pinId}" style="margin-top:6px; font-size:13px;"><i>Loading replies...</i></div>

                    <form onsubmit="postReply(event, ${pinId})" style="margin-top:8px; font-size:13px;">
                        <input type="hidden" name="pin_id" value="${pinId}">
                        <input name="username" placeholder="Your name" required style="width:95%; margin-bottom:4px; padding:4px"><br>
                        <textarea name="message" rows="2" placeholder="Write a reply..." required style="width:95%; padding:4px"></textarea><br>
                        <button type="submit" style="padding:4px 8px; background:green; color:white; border:none; border-radius:3px">Reply</button>
                    </form>
                `;

                const marker = L.marker([lat, lng]).addTo(map).bindPopup(content);
                marker.on('popupopen', () => loadReplies(pinId));
            });
        });
}

// Load replies from backend
function loadReplies(pinId) {
    fetch(`/maps/get_replies/${pinId}`)
        .then(res => res.json())
        .then(replies => {
            const container = document.getElementById(`replies-${pinId}`);
            if (!replies.length) {
                container.innerHTML = "<i>No replies yet.</i>";
                return;
            }
            container.innerHTML = `<b>Replies:</b><br>` + replies.map(
                ([username, message]) => `<b>${username}:</b> ${message}`
            ).join("<br>");
        });
}

// Submit reply to backend
function postReply(event, pinId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    fetch('/maps/add_reply', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(() => {
        loadReplies(pinId);
        form.reset();
    });
}

// Load existing pins on page load
loadPins();

