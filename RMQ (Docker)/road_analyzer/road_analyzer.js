const MicroMQ = require('micromq');
const config  = require("./config.json");

const app = new MicroMQ(
{
   name: 'road_analyzer',
   rabbit: 
   {  
      url: config.Gateway.url,
   }
});

app.post('/build', async (req, res) => 
{
   var lines = req.body.lines;
   var quality = [];
   // типо нейронка работает
   for (var i = 0; i < lines.length; i++)
      quality.push(Math.random());
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
});

app.start();
console.log("Analyzer started");