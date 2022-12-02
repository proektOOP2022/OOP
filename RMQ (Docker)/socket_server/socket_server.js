const path = require('path');
const express = require('express');
var bodyParser = require('body-parser');
const config  = require("./config.json");

const Gateway = require('micromq/gateway');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

var EasyYandexS3 = require('easy-yandex-s3');

const gateway = new Gateway(
{
   microservices: ['road_analyzer', 'database_service'],
   rabbit: 
   {   
      url: config.Gateway.url,
   },
   requests: 
   {  
      timeout: 120000
   }
});

var staticSiteOptions = 
{
   portnum: config.Server.port,
   maxAge: 0
};

var s3 = new EasyYandexS3(
{
   auth: 
   {
     accessKeyId: config.YandexStorage.accessKeyId,
     secretAccessKey: config.YandexStorage.secretAccessKey,
   },
   Bucket: config.YandexStorage.bucketName
});

io.on('connection', (socket) => 
{
   socket.on('image', (n, img) =>
   {
      s3.Upload(
         {
            buffer: img,
            name: n + ".jpg"
         },
         "/" + socket.id + "/"
      );
   });

   socket.on('disconnect', async () =>
   {
      var dir = await s3.GetList("/" + socket.id + "/");
      for (var i = 0; i < dir.Contents.length; i++)
         s3.Remove(dir.Contents[i].Key);
   });
});

app.use(gateway.middleware());
app.use(bodyParser.json());

app.use(express.static(
   path.join(__dirname, "site"),
   staticSiteOptions
));

app.use('/build', (req, res) => res.delegate('road_analyzer'));
app.use('/data_get', (req, res) => res.delegate('database_service'));

http.listen(config.Server.port, config.Server.host, () =>
{
   console.log(`Server listens http://${config.Server.host}:${config.Server.port}`);
});