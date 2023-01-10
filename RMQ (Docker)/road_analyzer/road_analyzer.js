const MicroMQ = require('micromq');
const fs = require('fs');
const deasync = require('deasync');
const { PythonShell } = require('python-shell')
const EasyYandexS3 = require('easy-yandex-s3');

const config  = require("./config.json");

var s3 = new EasyYandexS3(
{
   auth: 
   {
      accessKeyId: config.YandexStorage.accessKeyId,
      secretAccessKey: config.YandexStorage.secretAccessKey,
   },
   Bucket: config.YandexStorage.bucketName
});

const app = new MicroMQ(
{
   name: 'road_analyzer',
   rabbit: 
   {  
      url: config.Gateway.url,
   }
});

app.post('/build', (req, res) => 
{
   var lines = req.body.lines;
   fs.mkdirSync("img");
   var input = { images: [] };
   for (var i = 0; i < lines.length; i++)
   {
      s3.Download(req.body.id + `/${i}.jpg`, `img/${i}(${req.body.id}).jpg`);
      deasync.sleep(500);
      input.images.push({file_name: `${i}.jpg`});
   }
   var jsonInput = JSON.stringify(input);
   fs.writeFileSync("img/annotations.json", jsonInput);

   var done = false;
   PythonShell.run("detr.py", null, (err, ans) =>
   {
      console.log(err);
      var qualityJson = require("./quality.json");
      var quality = qualityJson.quality;
      app.ask('database_service', 
      {
         server: 
         {
            action: 'database_set',
            meta: 
            {
               n: lines.length,
               lines: lines,
               quality: quality
            }
         }
      });
      res.json(
      {
         quality: quality,
      });
      done = true;
   })
   deasync.loopWhile(function() { return !done; });
   fs.rmSync("img", { recursive: true });
});

app.start();
console.log("Analyzer started");