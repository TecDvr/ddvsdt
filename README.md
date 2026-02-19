# TaskFlow - Datadog vs Dynatrace Observability Test App

A full-stack task management application designed to evaluate Datadog and Dynatrace side by side. The application is intentionally clean -- no observability SDKs or agent code baked in. On an EC2 host with Dynatrace OneAgent installed, everything is auto-instrumented.

## Architecture

```
Browser --> Nginx (port 80) --> Express API (port 4000) --> PostgreSQL
```

- **Frontend**: React (Vite + TypeScript + Tailwind CSS), built to static files, served by Nginx
- **API**: Node.js/Express with full CRUD, health checks, and debug/test endpoints
- **Database**: PostgreSQL 16 with seed data
- **Reverse Proxy**: Nginx serves the SPA and proxies `/api/*` to Express

### Why This Stack

This architecture is specifically designed for Dynatrace OneAgent full-stack monitoring:

- **Nginx** is a supported web server for OneAgent RUM auto-injection (the JavaScript tag gets injected into HTML responses automatically)
- **Express** is auto-instrumented via `LD_PRELOAD` -- no `@dynatrace/oneagent` package needed
- **PostgreSQL** queries get full visibility via process-level injection
- **Container stdout/stderr** is collected by OneAgent's Log Module (requires Docker's default `json-file` logging driver)

## Local Development

### Prerequisites

- Docker and Docker Compose

### Run

```bash
docker compose up --build
```

Open http://localhost to use the app.

### Services

| Service    | URL                    | Description                   |
| ---------- | ---------------------- | ----------------------------- |
| Frontend   | http://localhost       | React SPA served by Nginx     |
| API        | http://localhost:4000  | Express REST API              |
| PostgreSQL | localhost:5432         | Database (taskuser/taskpass)   |

### API Endpoints

| Method | Path               | Description                                      |
| ------ | ------------------ | ------------------------------------------------ |
| GET    | /api/tasks         | List tasks (query: ?status=&priority=&search=)    |
| GET    | /api/tasks/:id     | Get task by ID                                   |
| POST   | /api/tasks         | Create task                                      |
| PUT    | /api/tasks/:id     | Update task                                      |
| DELETE | /api/tasks/:id     | Delete task                                      |
| GET    | /api/health        | Health check (DB status, uptime)                 |
| GET    | /api/debug/slow    | Slow response (?delay=3000)                      |
| GET    | /api/debug/error   | Triggers a 500 error                             |
| GET    | /api/debug/cpu     | CPU-intensive fibonacci (?n=40)                  |
| GET    | /api/debug/db-heavy| 20 concurrent DB queries with pg_sleep           |

## EC2 Deployment

### 1. Launch EC2 Instance

- **AMI**: Amazon Linux 2023
- **Instance type**: t3.medium or larger (OneAgent needs ~200 MB RAM)
- **Storage**: 20 GB+ (OneAgent requires ~12 GB disk space)
- **Security group**: Open ports 22 (SSH), 80 (HTTP)

### 2. Install Docker

```bash
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Log out and back in for group changes
exit
```

### 3. Install Dynatrace OneAgent

From your Dynatrace environment:

1. Go to **Dynatrace Hub > OneAgent > Set up > Linux**
2. Copy the `wget` + `sh` command provided
3. Run it on the EC2 instance:

```bash
sudo wget -O Dynatrace-OneAgent.sh "https://<ENV_ID>.live.dynatrace.com/api/v1/deployment/installer/agent/unix/default/latest?Api-Token=<PAAS_TOKEN>&arch=x86"
sudo /bin/sh Dynatrace-OneAgent.sh
```

OneAgent installs as a system service and auto-instruments all Docker containers. No code changes or container modifications needed.

**What OneAgent provides automatically:**

- **APM**: Distributed traces across Nginx, Express, and PostgreSQL via `LD_PRELOAD` injection
- **RUM**: Auto-injected JavaScript tag in Nginx HTML responses
- **Logs**: Container stdout/stderr collected from `/var/lib/docker/containers` (json-file driver)
- **Container monitoring**: Per-container CPU, memory, and network metrics
- **Host metrics**: EC2 instance CPU, memory, disk, network
- **Process monitoring**: All processes including PostgreSQL
- **Database monitoring**: Query-level PostgreSQL visibility via process injection
- **Code-level vulnerability detection**: Real-time library scanning

### 4. Install Datadog Agent

```bash
DD_API_KEY=<YOUR_DD_API_KEY> DD_SITE="datadoghq.com" bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"
```

Configure container monitoring in `/etc/datadog-agent/datadog.yaml`:

```yaml
logs_enabled: true
listeners:
  - name: docker
config_providers:
  - name: docker
    polling: true
```

Restart the agent:

```bash
sudo systemctl restart datadog-agent
```

### 5. Deploy the Application

```bash
git clone <REPO_URL> /home/ec2-user/ddvsdt
cd /home/ec2-user/ddvsdt
docker compose up -d --build
```

The app is now accessible at `http://<EC2_PUBLIC_IP>`.

### RUM Note for SPA

OneAgent auto-injects the RUM JavaScript tag into HTML responses served by Nginx. For a React SPA, this covers the initial `index.html` load, and the injected script tracks subsequent client-side navigations.

If auto-injection does not activate for the Nginx container process, add the RUM tag manually to `client/index.html`:

```html
<head>
  <script type="text/javascript" src="https://<ENV_ID>.live.dynatrace.com/jstag/<SCRIPT_ID>"></script>
  <!-- rest of head -->
</head>
```

The exact snippet is available in Dynatrace under **Digital Experience > Web frontends > Setup**.

## Tear Down

```bash
docker compose down -v   # removes volumes (database data)
docker compose down      # keeps volumes
```
