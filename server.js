const express = require("express");
const redis = require("redis");

const app = express();

const client = redis.createClient({
  url: "redis://redis:6379"
});

client.connect();

app.get("/", async (req, res) => {
  const visits = await client.incr("visits");

  res.send(`
    <h1>Atharva's Server V2</h1>
    <h2>Visit Count: ${visits}</h2>
  `);
});

app.listen(3000, () => {
  console.log("Server running");
});
