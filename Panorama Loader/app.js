const path = require('path');
const express = require('express');
const fs = require('fs');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const host = '127.0.0.1';
const port = 8000;

var staticSiteOptions = {
   portnum: port,
   maxAge: 0
};

io.on('connection', (socket) => 
{
   socket.on('image', (n, img) =>
   {
      fs.writeFileSync("resources/" + n + ".jpg", img);
   });
   socket.on('log', (log) =>
   {
      fs.writeFileSync("resources/log.txt", log);
   });
});

app.use(express.static(
   path.join(__dirname, "site"),
   staticSiteOptions
));

http.listen(port, host, () =>
   console.log(`Server listens http://${host}:${port}`)
);