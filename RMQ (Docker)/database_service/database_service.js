var mysql = require('mysql');
const MicroMQ = require('micromq');
const config = require("./config.json");

const app = new MicroMQ(
{
    name: 'database_service',
    rabbit: 
    {  
        url: config.Gateway.url,
    }
});

var connection = mysql.createConnection(
{
    host: config.Database.host,
    user: config.Database.user,
    password: config.Database.password,
    database: config.Database.name
});

function get_query(id, angle)
{
    var q = `SELECT quality FROM \`Table\` WHERE id = "${id}" AND angle = ${angle};`;
    return q;
}

function set_query(id, angle, quality)
{
    var q = `INSERT INTO \`Table\` VALUES ("${id}", ${angle}, ${quality}, CURRENT_TIMESTAMP)`;
    return q;
}

function delete_query(id, angle)
{
    var q = `DELETE FROM \`Table\` WHERE id = "${id}" AND angle = ${angle} AND timestamp < (CURRENT_TIMESTAMP - ${config.Database.lifetime})\n`
    return q;
}

app.post('/data_get', async (req, res) => 
{
    var id = req.body.id;
    var angle = req.body.angle;
    connection.query(delete_query(id, angle), (err1, res1, f1) =>
    {
        if (err1) throw err1;
        connection.query(get_query(id, angle), (err2, res2, f2) =>
        {
            if (err2) throw err2;
            var q = -1;
            if (res2.length > 0)
                q = res2[0].quality;
            res.json(
            {
                quality: q,
            });
        });
    });
});

app.action('database_set', (meta) => 
{
    for (var i = 0; i < meta.n; i++)
    {
        var id = meta.lines[i][0];
        var angle = meta.lines[i][1];
        var quality = meta.quality[i];
        connection.query(set_query(id, angle, quality), (err, res, f) => {});
    }
    return { ok: true };
});

connection.connect();
app.start();
console.log("Database service started");