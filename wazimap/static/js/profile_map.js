var ProfileMaps = function() {
    var self = this;

    this.featureGeoStyle = {
        "fillColor": "#66c2a5",
        "color": "#777",
        "weight": 2,
        "opacity": 0.3,
        "fillOpacity": 0.5,
        "clickable": false
    };
    
    this.layerStyle = {
        "clickable": true,
        "color": "#00d",
        "fillColor": "#ccc",
        "weight": 1.0,
        "opacity": 0.3,
        "fillOpacity": 0.3,
    };

    this.hoverStyle = {
        "fillColor": "#66c2a5",
        "fillOpacity": 0.7,
    };

    this.drawMapsForProfile = function(geo) {
        var geo_level = geo.this.geo_level;
        var geo_code = geo.this.geo_code;
        var osm_area_id = geo.this.osm_area_id;
        var child_level = geo.this.child_level;

        var allowMapDrag = (browserWidth > 480) ? true : false;

        // draw a map
        this.map = L.map('slippy-map', {
            scrollWheelZoom: false,
            zoomControl: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            dragging: allowMapDrag,
            touchZoom: allowMapDrag
        });

        if (allowMapDrag) {
            this.map.addControl(new L.Control.Zoom({
                position: 'topright'
            }));
        }

        // add imagery
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
          subdomains: 'abc',
          maxZoom: 17
        }).addTo(this.map);

        // load all map shaps for this level
        GeometryLoader.loadGeometryForLevel(geo_level, function(features) {
            // split into this geo, and everything else
            var groups = _.partition(features.features, function(f) {
                return f.properties.code == geo_code;
            });
            var this_geo = groups[0] ? groups[0][0] : null;
            features = groups[1];

            // draw the current geo
            if (this_geo) {
                self.drawFocusFeature(this_geo);
            }

            // draw the rest
            self.drawFeatures(features);
        });

        this.drawFocusFeature = function(feature) {
            var layer = L.geoJson([feature], {
                style: self.featureGeoStyle,
            });
            this.map.addLayer(layer);
            var objBounds = layer.getBounds();

            if (browserWidth > 768) {
                var z;
                for(z = 16; z > 2; z--) {
                    var swPix = this.map.project(objBounds.getSouthWest(), z),
                        nePix = this.map.project(objBounds.getNorthEast(), z),
                        pixWidth = Math.abs(nePix.x - swPix.x),
                        pixHeight = Math.abs(nePix.y - swPix.y);
                    if (pixWidth <  500 && pixHeight < 400) {
                        break;
                    }
                }

                this.map.setView(layer.getBounds().getCenter(), z);
                this.map.panBy([-270, 0], {animate: false});
            } else {
                this.map.fitBounds(layer.getBounds());
            }
        };

        this.drawFeatures = function(features) {
            // draw all others
            L.geoJson(features, {
                style: this.layerStyle,
                onEachFeature: function(feature, layer) {
                    layer.bindLabel(feature.properties.name, {direction: 'auto'});

                    layer.on('mouseover', function() {
                        layer.setStyle(self.hoverStyle);
                    });
                    layer.on('mouseout', function() {
                        layer.setStyle(self.layerStyle);
                    });
                    layer.on('click', function() {
                        window.location = '/profiles/' + feature.properties.level + '-' + feature.properties.code + '/';
                    });
                },
            }).addTo(this.map);
        };
    };
};
