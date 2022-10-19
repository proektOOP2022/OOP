const start_point = [55.814058, 37.498751];
const radius = 250;

function dist(a, b)
{
    var d = (a[0] - b[0]) * (a[0] - b[0]) * 111000 * 111000;
    d += (a[1] - b[1]) * (a[1] - b[1]) * 62600 * 62600;
    return Math.sqrt(d);
}

ymaps.ready(function () {
    if (!ymaps.panorama.isSupported()) {
        return;
    }

    map = new ymaps.Map('map', 
    {
        center: start_point,
        zoom: 15,
        controls: []
    });

    var circle = new ymaps.Circle(
    [ start_point, radius], {}, 
    {
        fillColor: "#00FF0060",
        strokeColor: "#009900",
        strokeOpacity: 0.5,
        strokeWidth: 2
    });
    map.geoObjects.add(circle);

    ymaps.panorama.createPlayer
    (
        'loader',
        start_point,
        {
            controls: []
        }
    ).done
    (async function(help)
    {
        var log = "";
        var used = new Set();
        var promise_queue = [];
        var point_queue = [];
        var a = help.getPanorama().getConnectionArrows();
        for (i = 0; i < a.length; i++)
        {
            promise_queue.push(a[i].getConnectedPanorama());
            point_queue.push(start_point);
        }
        used.add(help.getPanorama().metadata._data.Data.panoramaId);
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
            help.setPanorama(cur);
            help.lookAt(point);
            var load = new Promise((resolve, reject) => 
                setTimeout(() => resolve(), 500));
            load.then(() =>
            {
                var canvas = document.getElementsByClassName("ymaps-2-1-79-panorama-screen__canvas ymaps-2-1-79-touch-action-none ymaps-2-1-79-user-selection-none");
                var link = document.createElement("a");
                link.href = canvas[0].toDataURL("image/jpeg");
                link.download = n + ".jpg";
                link.click();
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
        var link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "log.txt";
        link.click();
    });
});