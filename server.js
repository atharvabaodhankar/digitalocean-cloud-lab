const express = require("express");
const redis = require("redis");
const path = require("path");

const app = express();

// Serve static assets from the current root directory (so architecture.png is accessible)
app.use(express.static(__dirname));

const client = redis.createClient({
  url: "redis://redis:6379"
});

client.connect().catch(err => console.error("Redis client connection failed:", err));

// Track deploy/startup time
const deployTime = new Date();
const deployTimeStr = deployTime.toLocaleDateString("en-US", {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
}) + " UTC";

// Helper to format process uptime
function getUptime() {
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

app.get("/", async (req, res) => {
  let visits = "N/A";
  let redisStatus = "DISCONNECTED";

  try {
    if (client.isOpen) {
      visits = await client.incr("visits");
      redisStatus = "CONNECTED";
    }
  } catch (error) {
    console.error("Redis increment failed:", error);
  }

  const uptimeStr = getUptime();

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
      --pulse-color: #10b981; /* Green pulse indicating online */
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
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      color: #10b981;
    }

    .pulse {
      width: 8px;
      height: 8px;
      background-color: var(--pulse-color);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse-animation 1.5s infinite;
    }

    @keyframes pulse-animation {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }

    .dashboard-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .dashboard-row {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .main-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 900px) {
      .main-grid {
        grid-template-columns: 1.2fr 0.8fr;
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
      margin-bottom: 0.5rem;
      font-family: 'Space Grotesk', sans-serif;
    }

    .counter-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3.5rem;
      font-weight: 700;
      line-height: 1.1;
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
      image-rendering: -webkit-optimize-contrast;
    }

    @media (max-width: 640px) {
      .architecture-img {
        max-width: 100%;
        min-height: 200px;
        object-fit: contain;
      }
    }

    /* List of details */
    .details-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .dashboard-row {
        grid-template-columns: 1fr;
      }
      
      .counter-value {
        font-size: 2.5rem;
      }
      
      .counter-title {
        font-size: 0.75rem;
      }
      
      header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
      
      h1 {
        font-size: 1.5rem;
      }
      
      .details-list {
        grid-template-columns: 1fr;
      }
      
      .main-grid {
        grid-template-columns: 1fr;
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

    /* Infrastructure list & layout styles */
    .infra-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 1.5rem;
    }

    .infra-list li {
      font-size: 0.95rem;
      color: var(--text-muted);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .infra-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .infra-icon svg {
      width: 100%;
      height: 100%;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.5;
    }

    .meta-section {
      border-top: 1px solid var(--card-border);
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .meta-label {
      color: var(--text-dark);
    }

    .meta-value {
      font-family: 'Space Grotesk', sans-serif;
      color: var(--text-muted);
      font-weight: 500;
    }

    .status-connected {
      color: #10b981;
      font-weight: 600;
    }

    .status-disconnected {
      color: #ef4444;
      font-weight: 600;
    }

    .link-section {
      margin-top: auto;
      padding-top: 1rem;
    }

    .source-link {
      display: block;
      width: 100%;
      text-align: center;
      background: #ffffff;
      color: #000000;
      text-decoration: none;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.75rem;
      border-radius: 8px;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .source-link:hover {
      background: #e4e4e7;
      transform: translateY(-1px);
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
        <span>ONLINE</span>
      </div>
    </header>

    <!-- Top Dashboard Metrics Row -->
    <div class="dashboard-row">
      <div class="card">
        <span class="counter-title">Visitors</span>
        <div class="counter-value">${visits}</div>
        <div class="counter-desc">Total visits stored in Redis cache. Atomically incremented on each route hit.</div>
      </div>
      <div class="card">
        <span class="counter-title">Server Uptime</span>
        <div class="counter-value">${uptimeStr}</div>
        <div class="counter-desc">Elapsed time since the application container process was started.</div>
      </div>
      <div class="card">
        <span class="counter-title">Orchestration</span>
        <div class="counter-value">3</div>
        <div class="counter-desc">Total active containers (App, Redis, Nginx) running in default bridge network.</div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="main-grid">
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
            <span class="detail-value">Nginx reverse proxy handles SSL handshake and routes traffic.</span>
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

      <!-- Infrastructure Card -->
      <div class="card">
        <div class="section-title" style="margin-bottom: 1.5rem;">
          <span>Infrastructure</span>
        </div>

        <ul class="infra-list">
          <li>
            <span class="infra-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="12" y1="2" x2="12" y2="4"></line>
                <line x1="12" y1="20" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="4" y2="12"></line>
                <line x1="20" y1="12" x2="22" y2="12"></line>
              </svg>
            </span>
            <span>DigitalOcean Droplet</span>
          </li>
          <li>
            <span class="infra-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18v12H3z"></path>
                <path d="M8 10h2v4H8zM14 10h2v4h-2z"></path>
                <path d="M6 18h12M9 21h6"></path>
              </svg>
            </span>
            <span>Docker Compose</span>
          </li>
          <li>
            <span class="infra-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1l9 5v6c0 6-9 11-9 11s-9-5-9-11V6l9-5z"></path>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </span>
            <span>Let's Encrypt SSL</span>
          </li>
          <li>
            <span class="infra-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </span>
            <span>GitHub Actions CI/CD</span>
          </li>
          <li>
            <span class="infra-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
                <path d="M8 12h8M12 8v8"></path>
              </svg>
            </span>
            <span>UFW + Fail2Ban</span>
          </li>
        </ul>

        <div class="meta-section">
          <div class="meta-item">
            <span class="meta-label">Version</span>
            <span class="meta-value">v2.0.0</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Last Deploy</span>
            <span class="meta-value">${deployTimeStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Redis Engine</span>
            <span class="meta-value ${redisStatus === 'CONNECTED' ? 'status-connected' : 'status-disconnected'}">${redisStatus}</span>
          </div>
        </div>

        <div class="link-section">
          <a class="source-link" href="https://github.com/atharvabaodhankar/digitalocean-cloud-lab" target="_blank">
            View Source →
          </a>
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
