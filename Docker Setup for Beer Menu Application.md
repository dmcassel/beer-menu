# Docker Setup for Beer Menu Application

This guide explains how to run the Beer Menu application using Docker Compose, which includes PostgreSQL, pgAdmin, and the Node.js/UI layer.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose 2.0 or later

## Services

The Docker Compose configuration includes three services:

1. **PostgreSQL** (port 5432) - Database server
2. **pgAdmin** (port 8080) - Database management interface
3. **App** (port 3000) - Node.js application with React UI

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/dmcassel/beer-menu.git
cd beer-menu
```

### 2. Configure Environment Variables

Copy the example environment file and customize if needed:

```bash
cp .env.example .env.local
```

The default configuration works out of the box with Docker Compose.

### 3. Start All Services

```bash
docker-compose up -d
```

This command will:

- Pull the required Docker images
- Build the Node.js application
- Start PostgreSQL, pgAdmin, and the application
- Run database migrations automatically

### 4. Access the Services

- **Application**: http://localhost:3000
- **pgAdmin**: http://localhost:8080
  - Email: `dmcassel@gmail.com`
  - Password: `adminpass`

## Database Management with pgAdmin

### First Time Setup

1. Open pgAdmin at http://localhost:8080
2. Click "Add New Server"
3. In the "General" tab:
   - Name: `Beer Menu DB` (or any name you prefer)
4. In the "Connection" tab:
   - Host: `postgres`
   - Port: `5432`
   - Database: `beerdb`
   - Username: `beeruser`
   - Password: `beerpass`
5. Click "Save"

## Development Workflow

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f pgadmin
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v
```

### Rebuild Application

If you make changes to the code:

```bash
docker-compose up -d --build app
```

### Run Database Migrations

Migrations run automatically on startup, but you can run them manually:

```bash
docker-compose exec app pnpm db:push
```

### Access Application Shell

```bash
docker-compose exec app sh
```

### Access PostgreSQL CLI

```bash
docker-compose exec postgres psql -U postgres -d beer_menu
```

## Configuration

### Environment Variables

Key environment variables in `docker-compose.yml`:

**PostgreSQL:**

- `POSTGRES_USER`: Database user (default: `postgres`)
- `POSTGRES_PASSWORD`: Database password (default: `postgres`)
- `POSTGRES_DB`: Database name (default: `beer_menu`)

**pgAdmin:**

- `PGADMIN_DEFAULT_EMAIL`: Login email (default: `admin@beermenu.local`)
- `PGADMIN_DEFAULT_PASSWORD`: Login password (default: `admin`)

**Application:**

- `NODE_ENV`: Environment mode (default: `production`)
- `PORT`: Application port (default: `3000`)
- `DATABASE_URL`: PostgreSQL connection string

### Ports

Default ports can be changed in `docker-compose.yml`:

```yaml
ports:
  - "HOST_PORT:CONTAINER_PORT"
```

For example, to run the app on port 8080:

```yaml
app:
  ports:
    - "8080:3000"
```

## Data Persistence

Data is persisted using Docker volumes:

- `postgres_data`: PostgreSQL database files
- `pgadmin_data`: pgAdmin configuration and settings

These volumes persist even when containers are stopped or removed.

## Troubleshooting

### Port Already in Use

If you see "port is already allocated" errors:

1. Check what's using the port:

   ```bash
   # Linux/Mac
   lsof -i :3000

   # Windows
   netstat -ano | findstr :3000
   ```

2. Either stop the conflicting service or change the port in `docker-compose.yml`

### Database Connection Issues

1. Ensure PostgreSQL is healthy:

   ```bash
   docker-compose ps
   ```

2. Check PostgreSQL logs:

   ```bash
   docker-compose logs postgres
   ```

3. Verify the connection string in your `.env.local` file matches the Docker Compose configuration

### Application Won't Start

1. Check application logs:

   ```bash
   docker-compose logs app
   ```

2. Ensure all dependencies are installed:

   ```bash
   docker-compose exec app pnpm install
   ```

3. Rebuild the container:
   ```bash
   docker-compose up -d --build app
   ```

### Reset Everything

To start fresh (WARNING: This deletes all data):

```bash
docker-compose down -v
docker-compose up -d --build
```

## Production Deployment

For production deployment, consider:

1. **Use environment-specific configuration files**:

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Set strong passwords** in environment variables or secrets

3. **Remove development volume mounts** from the app service

4. **Use a reverse proxy** (nginx, Traefik) for SSL/TLS termination

5. **Configure backup strategies** for PostgreSQL data

6. **Monitor logs and metrics** using tools like Prometheus and Grafana

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4)
