# DigitalOcean Cloud Lab

A containerized Node.js and Redis application deployed on a DigitalOcean Droplet, featuring automated CI/CD via GitHub Actions and secure SSL termination with Nginx and Let's Encrypt.

This repository serves as a complete cloud laboratory, demonstrating modern DevOps practices, microservices orchestration, and automated deployment pipelines.

## 🚀 Live Demo

The application is deployed and accessible at:
**[https://lab.atharvabaodhankar.me](https://lab.atharvabaodhankar.me)**

---

## 🏗️ System Architecture

The application is built using a multi-container architecture orchestrated via Docker Compose.

```
                  ┌──────────────────────────────┐
                  │          Internet            │
                  └──────────────┬───────────────┘
                                 │ HTTP/HTTPS (80/443)
                                 ▼
                  ┌──────────────────────────────┐
                  │      Nginx TLS Gateway       │
                  │      (Let's Encrypt SSL)     │
                  └──────────────┬───────────────┘
                                 │ Reverse Proxy
                                 ▼
                  ┌──────────────────────────────┐
                  │     Express Application      │ (Port 3000 - Private Network)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │         Redis Cache          │ (Port 6379 - Private Network)
                  └──────────────────────────────┘
```

### Components
1. **Nginx TLS Gateway**: Acts as the reverse proxy, terminating SSL/TLS connections, automatically redirecting HTTP traffic to HTTPS, and proxying requests to the application server.
2. **Express Application**: A Node.js application that handles routing, serves the dashboard UI, tracks server uptime, and communicates with Redis.
3. **Redis Cache**: A fast, in-memory data store used to atomically increment and store visitor counts.

A visual system architecture diagram is also available in the repository as [architecture.png](architecture.png).

---

## 🛠️ Tech Stack & Infrastructure

- **Cloud Provider**: DigitalOcean (Droplet VPS)
- **Runtime Environment**: Node.js 22 (Alpine)
- **In-Memory Store**: Redis
- **Reverse Proxy & Web Server**: Nginx
- **Containerization**: Docker & Docker Compose
- **Security**: Let's Encrypt SSL, UFW (Uncomplicated Firewall), Fail2Ban
- **CI/CD**: GitHub Actions

---

## 📂 Repository Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── Dockerfile                  # Multi-stage-like Docker build for Node.js
├── docker-compose.yml          # Multi-container orchestration config
├── nginx.conf                  # Nginx server blocks (HTTP redirect & reverse proxy)
├── package.json                # Project metadata and dependencies
├── server.js                   # Express application and dashboard UI
└── architecture.png            # Visual architecture diagram
```

---

## 💻 Local Development

To run the entire stack locally, ensure you have **Docker** and **Docker Compose** installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/atharvabaodhankar/digitalocean-cloud-lab.git
   cd digitalocean-cloud-lab
   ```

2. **Start the containers:**
   ```bash
   docker compose up --build
   ```

3. **Access the application:**
   - The Express application will be running at `http://localhost:3000`.
   - *Note: In the local environment, Nginx will attempt to bind to ports `80` and `443`. If those ports are already in use, or if you do not have Let's Encrypt certificates locally, you can access the app container directly at `http://localhost:3000` or modify the `docker-compose.yml` file to suit your local setup.*

---

## 🚀 Deployment & CI/CD Pipeline

The project features a fully automated continuous deployment pipeline.

### GitHub Actions Workflow (`deploy.yml`)
On every push to the `main` branch, the workflow:
1. Connects to the DigitalOcean Droplet over SSH using the `appleboy/ssh-action` action.
2. Pulls the latest code from the GitHub repository into the `~/visit-counter` directory.
3. Rebuilds and restarts the containerized services using `docker compose up -d --build`.

### Required GitHub Secrets
To configure the deployment pipeline, the following secrets must be added to the GitHub repository:
- `HOST`: The public IP address or domain name of the DigitalOcean Droplet.
- `USERNAME`: The SSH username (typically `root`).
- `SSH_KEY`: The private SSH key used to authenticate with the Droplet.

---

## 🔒 Server Security Hardening

To secure the production droplet, the following measures are recommended and configured:
1. **Firewall (UFW)**: Only ports `80` (HTTP), `443` (HTTPS), and your custom SSH port are exposed to the public.
2. **Brute Force Protection (Fail2Ban)**: Automatically bans IP addresses that show malicious signs, such as too many failed SSH login attempts.
3. **Docker Bridge Network**: The Express App and Redis containers communicate over a private Docker network and are not exposed directly to the host's public ports. Only Nginx is exposed.
4. **SSL/TLS**: Secured using Let's Encrypt with automated certificate renewals and high-strength cipher suites.
