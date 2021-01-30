const keys = require('./keys');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');

// SETTING UP APP
const app =  express();
app.use(cors());
app.use(bodyParser.json());

// SETTING UP POSTGRESS
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on('error', () => {
    console.log('lost pg connection')
});

// IF EMPTY NEED AT LEAST A TABLE
pgClient.query("CREATE TABLE IF NOT EXISTS values(number int)")
        .catch(e=>console.error("PORSTGRESS CLIENT ERROR:",e));

// SETTING UP REDIS CLIENT
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
console.info("REDIS CLIENT BACKEND", "HOST",keys.redisHost, "PORT", keys.redisPort);

redisClient.on("ready", function(msg) {
    console.error("REDIS CLIENT BACKEND ready",msg);
});
redisClient.on("connect", function(msg) {
    console.error("REDIS CLIENT BACKEND connect",msg);
});
redisClient.on("reconnecting", function(msg) {
    console.error("REDIS CLIENT BACKEND reconnecting",msg);
    console.info('BACKEND', 'REDIS_HOST', keys.redisHost, 'REDIS_PORT', keys.redisPort, "STATUS", redisClient.connected);
});
redisClient.on("end", function(msg) {
    console.error("REDIS CLIENT BACKEND end",msg);
});
redisClient.on("warning", function(msg) {
    console.error("REDIS CLIENT BACKEND warning",msg);
});
redisClient.on("error", function(error) {
    console.error("REDIS CLIENT BACKEND error",error);
  });

const redisPublisher = redisClient.duplicate();


// EXPRESS ROUTE HANDLER
app.get('/', (req, res) => {
    res.send('Hi');
});
app.get('/values/all', async (req, res) => {
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
});
app.get('/values/current', async (req, res) => {
    console.log("REDIS CLIENT STATUS",redisClient.connected);
    redisClient.hgetall('values', (err, values) =>{
        res.send(values);
    });
});
app.post('/values', async (req, res) => {
    let index = req.body.index;
    if(parseInt(index) > 40){
        return res.status(422).send("index too high");
    }
    redisClient.hset('values', 'index', 'nothing yet');
    redisPublisher.publish('insert', index);
    console.info("REDIS PUBLISHER", index);

    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    res.send({working: true});
});

app.listen(5000, (err) => {
    console.log("Listening");
});
