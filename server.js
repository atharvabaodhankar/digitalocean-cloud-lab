const express = require("express");
const redis = require("redis");
const path = require("path");

const app = express();

// Serve static assets from the current root directory (so architecture.png is accessible)
app.use(express.static(__dirname));

const client = redis.createClient({
  url: "redis://redis:6379"
});

client.connect();

app.get("/", async (req, res) => {
  const visits = await client.incr("visits");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atharva's Cloud Lab</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0c;
      --card-bg: #121216;
      --card-border: #22222a;
      --text-main: #ffffff;
      --text-muted: #a1a1aa;
      --text-dark: #71717a;
      --accent: #ffffff;
      --accent-muted: #3f3f46;
      --pulse-color: #ffffff;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow-x: hidden;
    }

    /* Subtle background grid pattern */
    body::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        radial-gradient(circle at 1px 1px, var(--card-border) 1px, transparent 0);
      background-size: 24px 24px;
      opacity: 0.3;
      z-index: -1;
      pointer-events: none;
    }

    .container {
      max-width: 1000px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1.5rem;
    }

    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      text-transform: uppercase;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 500;
      color: var(--text-muted);
    }

    .pulse {
      width: 8px;
      height: 8px;
      background-color: var(--pulse-color);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
      }
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .grid {
        grid-template-columns: 320px 1fr;
      }
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .card:hover {
      border-color: var(--text-muted);
      box-shadow: 0 4px 40px rgba(255, 255, 255, 0.03);
    }

    .counter-title {
      font-size: 0.9rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      font-family: 'Space Grotesk', sans-serif;
    }

    .counter-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 5rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.5rem;
      letter-spacing: -0.05em;
    }

    .counter-desc {
      font-size: 0.85rem;
      color: var(--text-dark);
      line-height: 1.4;
    }

    .architecture-card {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.2rem;
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Diagram container styling */
    .diagram-container {
      background: rgba(0, 0, 0, 0.25);
      border: 1px dashed var(--card-border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .architecture-img {
      width: 100%;
      height: auto;
      max-width: 650px;
      display: block;
      border-radius: 8px;
    }

    /* List of details */
    .details-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 600px) {
      .details-list {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-value {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.8rem;
      color: var(--text-dark);
      border-top: 1px solid var(--card-border);
      padding-top: 1.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Atharva's Cloud Lab</h1>
      <div class="status-badge">
        <span class="pulse"></span>
        <span>PROD ACTIVE</span>
      </div>
    </header>

    <div class="grid">
      <!-- Visit counter card -->
      <div class="card">
        <span class="counter-title">Analytics</span>
        <div class="counter-value">${visits}</div>
        <div class="counter-desc">Total page visits recorded in the Redis cache. This count is incremented atomically on every client request.</div>
      </div>

      <!-- Architecture Card -->
      <div class="card architecture-card">
        <div class="section-title">
          <span>System Architecture</span>
        </div>

        <div class="diagram-container">
          <img class="architecture-img" src="/architecture.png" alt="System Architecture Diagram" />
        </div>

        <div class="details-list">
          <div class="detail-item">
            <span class="detail-label">1. TLS Gateway</span>
            <span class="detail-value">Nginx handles HTTPS, proxying requests downstream.</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">2. App Server</span>
            <span class="detail-value">Express manages the API logic and coordinates with Redis.</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">3. In-Memory Store</span>
            <span class="detail-value">Redis tracks analytics via atomic increments.</span>
          </div>
        </div>
      </div>
    </div>

    <footer>
      DigitalOcean Cloud Lab • Powered by Docker & GitHub Actions
    </footer>
  </div>
</body>
</html>`);
});

app.listen(3000, () => {
  console.log("Server running");
});
