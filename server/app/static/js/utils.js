function logEvent(title, message = undefined) {
    if (typeof message == 'string')
        var str = JSON.stringify(JSON.parse(message), undefined, 4);
    let div =
        `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${title}</h5>
                <p class="card-text"></p>
            </div>
        </div>
        `;
    let d = $(div);
    let card_text = d.children().first().children().last();
    card_text.text((str === undefined) ? (message === undefined) ? '...' : str : str.trim());
    let x = $("#log-cards");
    x.append(d.html().trim());
}

(function () {
// save these original methods before they are overwritten
    let proto_initIcon = L.Marker.prototype._initIcon;
    let proto_setPos = L.Marker.prototype._setPos;

    let oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

    L.Marker.addInitHook(function () {
        let iconOptions = this.options.icon & this.options.icon.options;
        let iconAnchor = iconOptions & this.options.icon.options.iconAnchor;
        if (iconAnchor) {
            iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
        }
        this.options.rotationOrigin = this.options.rotationOrigin | iconAnchor | 'center bottom';
        this.options.rotationAngle = this.options.rotationAngle | 0;

        // ensure marker keeps rotated during dragging
        this.on('drag', function (e) {
            e.target._applyRotation();
        });
    });

    L.Marker.include({
        _initIcon: function () {
            proto_initIcon.call(this);
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },

        _applyRotation: function () {
            if (this.options.rotationAngle) {
                this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = this.options.rotationOrigin;

                if (oldIE) {
                    // for IE 9, use the 2D rotation
                    this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
                } else {
                    // for modern browsers, prefer the 3D accelerated version
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
                }
            }
        },

        setRotationAngle: function (angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function (origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
})();

function kphToMs(speed) {
    return speed / 3.6;
}

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function metersToLat(y) {
    //Earth’s radius, sphere
    let R = 6378137;

    //Coordinate offsets in radians
    let dLat = y / R;

    return dLat * 180 / Math.PI;
}

function metersToLng(x) {
    //Earth’s radius, sphere
    let R = 6378137;

    //Coordinate offsets in radians
    let dLng = x / R;

    return dLng * 180 / Math.PI * 1.48;
}

//https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
function measure(lat1, lon1, lat2, lon2) {  // generally used geo measurement function
    const R = 6378.137; // Radius of earth in KM
    let dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    let dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d * 1000; // meters
}
