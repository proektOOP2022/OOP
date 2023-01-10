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

function get_color(quality) 
{
    var r = parseInt((255 * (1 - quality)), 10);
    var g = parseInt((255 * quality), 10);
    r = r.toString(16);
    r = r.length == 1 ? "0" + r : r;
    g = g.toString(16);
    g = g.length == 1 ? "0" + g : g;
    return "#" + r + g + "00";
}

function database_get(id, angle)
{
    return new Promise((resolve, reject) =>
    {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function()
        {
            if (xmlHttp.readyState != 4)
                return;
            if (xmlHttp.status === 200)
            {
                var quality = JSON.parse(xmlHttp.responseText)
                resolve(quality);
            }
            else
            {
                console.error(xmlHttp.statusText);
                reject();
            }
        }
        var json = JSON.stringify(
        {
            id: id,
            angle: angle
        });
        xmlHttp.open("POST", "/data_get", true);
        xmlHttp.setRequestHeader('Content-Type', 'application/json');
        xmlHttp.timeout = 120000;
        xmlHttp.send(json);
    });
}

function draw_quality(a, b, quality)
{
    if (!map)
        return;
    var line = new ymaps.Polyline(
    [a, b], {}, 
    {
        balloonCloseButton: false,
        strokeColor: get_color(quality),
        strokeWidth: 4,
        strokeOpacity: 0.5
    });
    map.geoObjects.add(line);
}

function change_radius(input)
{
    if (!loader || !map || !circle || !socket.connected)
    {
        input.value = 0;
        return 0;
    }
    if (!circle.options.get("draggable"))
    {
        var radius = circle.geometry.getRadius();
        input.value = radius;
        return radius;
    }
    var radius = input.value;
    circle.geometry.setRadius(radius);
    return radius;
}

async function load_panoramas()
{
    if (!loader || !map || !circle || !socket.connected)
        return;
    map.geoObjects.removeAll();
    map.geoObjects.add(circle);
    var start_point = circle.geometry.getCoordinates();
    var radius = circle.geometry.getRadius();
    circle.options.set("draggable", false);
    loader = await loader;
    await loader.moveTo(start_point);
    var path = [];
    var query = [];
    var used = new Set();
    var promise_queue = [];
    var point_queue = [];
    var a = loader.getPanorama().getConnectionArrows();
    for (i = 0; i < a.length; i++)
    {
        promise_queue.push(a[i].getConnectedPanorama());
        point_queue.push(loader.getPanorama().getPosition());
    }
    used.add(loader.getPanorama().metadata._data.Data.panoramaId);
    var n = 0;
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
        var angle = parseInt(loader.getDirection()[0], 10);
        var saved_quality = await database_get(id, angle);
        saved_quality = saved_quality.quality;
        console.log(saved_quality);
        if (saved_quality >= 0)
        {
            draw_quality(pos, point, saved_quality);
        }
        else
        {
            var wait = new Promise((resolve, reject) => 
                setTimeout(() => resolve(), 500));
            await wait;
            var canvas = document.getElementsByClassName("ymaps-2-1-79-panorama-screen__canvas ymaps-2-1-79-touch-action-none ymaps-2-1-79-user-selection-none");
            var load = new Promise((resolve, reject) =>
            {
                canvas[0].toBlob((blob) => 
                {  
                    socket.emit("image", n, blob);
                    resolve();
                }, 'image/jpeg', 0.95); 
            });
            await load;
            path.push([[pos[0], pos[1]], [point[0], point[1]]]);
            query.push([id, angle]);
        }
        n++;
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function()
    {
        if (xmlHttp.readyState != 4)
            return;
        if (xmlHttp.status === 200)
        {
            var quality = JSON.parse(xmlHttp.responseText).quality;
            for (var i = 0; i < path.length; i++)
                draw_quality(path[i][0], path[i][1], quality[i]);
        }
        else
            console.error(xmlHttp.statusText);
        circle.options.set("draggable", true);
    }
    var json = JSON.stringify(
    {
        id: socket.id,
        lines: query
    });
    xmlHttp.open("POST", "/build", true);
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.timeout = 120000;
    xmlHttp.send(json);
}

ymaps.ready(function () {
    if (!ymaps.panorama.isSupported()) 
    {
        return;
    }

    map = new ymaps.Map('map', 
    {
        center: default_point,
        zoom: 15,
        controls: ['searchControl', 'fullscreenControl'],
    });

    circle = new ymaps.Circle(
    [ default_point, default_radius], {}, 
    {
        fillColor: "#FFFFFF30",
        strokeColor: "#AAAAAA",
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