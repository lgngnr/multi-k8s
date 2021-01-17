const redis = require('redis');
const keys = require('./keys');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});

console.info('WORKER', 'REDIS_HOST', keys.redisHost, 'REDIS_PORT', keys.redisPort, "STATUS", redisClient.connected);

redisClient.on("ready", function(msg) {
    console.error("REDIS CLIENT WORKER ready",msg);
});
redisClient.on("connect", function(msg) {
    console.error("REDIS CLIENT WORKER connect",msg);
});
redisClient.on("reconnecting", function(msg) {
    console.error("REDIS CLIENT WORKER reconnecting",msg);
    console.info('WORKER', 'REDIS_HOST', keys.redisHost, 'REDIS_PORT', keys.redisPort, "STATUS", redisClient.connected);
});
redisClient.on("end", function(msg) {
    console.error("REDIS CLIENT WORKER end",msg);
});
redisClient.on("warning", function(msg) {
    console.error("REDIS CLIENT WORKER warning",msg);
});
redisClient.on("error", function(error) {
    console.error("REDIS CLIENT WORKER error",error);
  });

const sub = redisClient.duplicate();

function fib (index)
{
    if(index < 2) return 1;
    return fib(index - 1 ) + fib(index - 2);
}


sub.on('message', (channel, message)=>{
        console.info("CALCULAING FIB ", message);
        redisClient.hset('values', message, fib(parseInt(message)));
    });
sub.subscribe('insert');