const default_point = [55.814058, 37.498751];
const default_radius = 150;

var socket = io();

var loader, map, circle;

function dist(a, b)
{
    var d = (a[0] - b[0]) * (a[0] - b[0]) * 111000 * 111000;
    d += (a[1] - b[1]) * (a[1] - b[1]) * 62600 * 62600;
    return Math.sqrt(d);
}

function change_radius(input)
{
    console.log(input);
    if (!loader || !map || !circle)
        return;
    if (!circle.options.get("draggable"))
    {
        input.value = circle.geometry.getRadius();
        return;
    }
    var radius = Number(input.value);
    if (isNaN(radius))
    {
        input.value = 0;
        radius = 0;
    }
    circle.geometry.setRadius(radius);
}

async function load_panoramas()
{
    if (!loader || !map || !circle)
        return;
    var start_point = circle.geometry.getCoordinates();
    var radius = circle.geometry.getRadius();
    circle.options.set("draggable", false);
    console.log(circle.options.draggable);
    loader = await loader;
    await loader.moveTo(start_point);
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
            canvas[0].toBlob((blob) => 
            {  
                socket.emit("image", n, blob);
            }, 'image/jpeg', 0.95); 

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
    socket.emit("log", blob);
    circle.options.set("draggable", true);
}

ymaps.ready(function () {
    if (!ymaps.panorama.isSupported()) {
        return;
    }

    map = new ymaps.Map('map', 
    {
        center: default_point,
        zoom: 15,
        controls: [],
    });

    circle = new ymaps.Circle(
    [ default_point, default_radius], {}, 
    {
        fillColor: "#00FF0060",
        strokeColor: "#009900",
        strokeOpacity: 0.5,
        strokeWidth: 2,
        draggable: true
    });
    map.geoObjects.add(circle);

    map.events.add('click', (e) =>
    {
        if (!circle)
            return;
        if (!circle.options.get("draggable"))
            return;
        var coords = e.get('coords');
        circle.geometry.setCoordinates(coords);
    });

    loader = ymaps.panorama.createPlayer
    (
        'loader',
        default_point,
        {
            controls: []
        }
    );
});