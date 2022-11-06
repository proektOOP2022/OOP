const start_point = [55.814058, 37.498751];
const radius = 150;

function dist(a, b)
{
    var d = (a[0] - b[0]) * (a[0] - b[0]) * 111000 * 111000;
    d += (a[1] - b[1]) * (a[1] - b[1]) * 62600 * 62600;
    return Math.sqrt(d);
}

// var socket = io();

ymaps.ready(function () {
    if (!ymaps.panorama.isSupported()) {
        return;
    }

    map = new ymaps.Map('map', 
    {
        center: start_point,
        zoom: 15,
        controls: ['fullscreenControl']
    });

    var circle = new ymaps.Circle(
    [ start_point, radius], {}, 
    {
        fillColor: "#00FF0060",
        strokeColor: "#009900",
        strokeOpacity: 0.5,
        strokeWidth: 2
    });
    console.log()
    map.geoObjects.add(circle);

    ymaps.panorama.createPlayer
    (
        'loader',
        start_point,
        {
            controls: []
        }
    ).done
    (async function(loader)
    {
        var log = "";
        var used = new Set();
        var promise_queue = [];
        var point_queue = [];
        var a = loader.getPanorama().getConnectionArrows();
        for (i = 0; i < a.length; i++)
        {
            promise_queue.push(a[i].getConnectedPanorama());
            point_queue.push(start_point);
        }
        used.add(loader.getPanorama().metadata._data.Data.panoramaId);
        var n = 0
        while (promise_queue.length > 0)  // bfs
        {
            var point = point_queue.shift();
            var promise = await promise_queue.shift();
            var cur = promise.valueOf();
            var pos = cur.getPosition();
            var id = cur.metadata._data.Data.panoramaId;
            if (used.has(id))
                continue;
            if (dist(pos, start_point) > radius)
                continue;
            used.add(id);
            var arrows = cur.getConnectionArrows();
            for (i = 0; i < arrows.length; i++)
            {
                promise_queue.push(arrows[i].getConnectedPanorama());
                point_queue.push(pos);
            }
            cur.getMarkers = function() { return []; };
            cur._connectionArrows = [];
            loader.setPanorama(cur);
            loader.lookAt(point);
            var load = new Promise((resolve, reject) => 
                setTimeout(() => resolve(), 500));
            load.then(() =>
            {
                var canvas = document.getElementsByClassName("ymaps-2-1-79-panorama-screen__canvas ymaps-2-1-79-touch-action-none ymaps-2-1-79-user-selection-none");
                // canvas[0].toBlob((blob) => 
                // {  
                //     socket.emit("image", n, blob);
                // }, 'image/jpeg', 0.95); 

            });
            await load;
            var line = new ymaps.Polyline(
            [ pos, point ], {}, 
            {
                balloonCloseButton: false,
                strokeColor: "#FF0000",
                strokeWidth: 4,
                strokeOpacity: 0.5
            });
            map.geoObjects.add(line);
            log += pos[0] + " " + pos[1] + " " + point[0] + " " + point[1] + "\n";
            n++;
        }
        log = n + "\n" + log;
        var blob = new Blob([log], {type: "text/plain"});
        // socket.emit("log", blob);
    });
});