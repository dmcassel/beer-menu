> **Note:** This PR has been updated to properly separate Docker Compose configuration from application runtime configuration.

# Multi-Environment Setup Guide

This document explains how to run the Beer Menu application in different environments (local development and production) using a segmented configuration approach.

## Configuration Overview

We use two types of environment files to manage configuration:

1.  **Docker Compose Configuration (`.env.compose.*`)**: These files configure the Docker environment itself, including service definitions, port mappings, and container-level environment variables. They are used with the `docker-compose --env-file` flag.
    -   `.env.compose.local`: For local development (committed to git).
    -   `.env.compose.prod`: For production (ignored by git).

2.  **Application Runtime Configuration (`.env.*`)**: These files provide runtime environment variables to the Node.js application (e.g., database URLs, API keys). They are loaded by the application code itself.
    -   `.env.local`: For local development (already exists in the repo).
    -   `.env.prod`: For production (ignored by git).

This separation ensures that infrastructure configuration (Docker) is distinct from application configuration (Node.js), preventing conflicts.

## Local Development Setup (Laptop)

To run the application in your local development environment:

1.  **Prerequisites**: Ensure you have Docker and Docker Compose installed.

2.  **Environment Files**: The repository includes `.env.compose.local` and `.env.local` with default settings. No changes are needed to get started.

3.  **Run the Application**:

    Use the following command to start the application. This command tells Docker Compose to use the `.env.compose.local` file for its configuration. The application inside the container will automatically pick up the `.env.local` file.

    ```bash
    docker-compose --env-file .env.compose.local up --build
    ```

4.  **Access the Application**:

    -   **Application**: [http://localhost:3000](http://localhost:3000)
    -   **pgAdmin**: [http://localhost:8080](http://localhost:8080)

## Production Setup (Rocky 8 Server)

To deploy the application in a production environment:

1.  **Prerequisites**: Ensure you have Docker and Docker Compose installed on your server.

2.  **Clone the Repository**:

    ```bash
    git clone https://github.com/dmcassel/beer-menu.git
    cd beer-menu
    ```

3.  **Create Production Environment Files**:

    Copy the templates to create your production environment files:

    ```bash
    # For Docker Compose configuration
    cp .env.compose.prod.template .env.compose.prod

    # For application runtime configuration
    cp .env.prod.template .env.prod
    ```

4.  **Configure Production Variables**:

    Open both `.env.compose.prod` and `.env.prod` with a text editor and replace the placeholder values with your actual production credentials and settings. **It is crucial to use strong, unique passwords.**

5.  **Run the Application**:

    Use the following command to start the application in production mode. This command tells Docker Compose to use the `.env.compose.prod` file. The application will need to be configured to load the `.env.prod` file in a production environment.

    ```bash
    docker-compose --env-file .env.compose.prod up -d --build
    ```

    The `-d` flag runs the containers in detached mode, which is recommended for production.

6.  **Access the Application**:

    -   **Application**: `http://<your_server_ip>:3010`
    -   **pgAdmin**: `http://<your_server_ip>:8080` (or the port you configured in `.env.compose.prod`)

## Updating Application to Load `.env.prod`

To complete the setup, you'll need to modify the application to load the `.env.prod` file when `NODE_ENV` is `production`. This can be done by updating the `start` script in `package.json`:

**Current `start` script:**
```json
"start": "cross-env NODE_ENV=production node dist/index.js"
```

**Recommended `start` script:**
```json
"start": "cross-env NODE_ENV=production tsx --env-file=.env.prod server/_core/index.ts"
```

This change ensures the production application loads its configuration from the correct file. This change is recommended to be done in a separate commit after this PR is merged.
