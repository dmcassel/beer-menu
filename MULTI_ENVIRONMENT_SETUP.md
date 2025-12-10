# Multi-Environment Setup Guide

This document explains how to run the Beer Menu application in different environments (local development and production) using Docker Compose and environment-specific configuration files.

## Overview

The application now uses a `.env` file to manage environment-specific variables. The `docker-compose.yml` file is configured to read variables from these files, allowing you to switch between configurations without modifying the compose file itself.

- **`.env.local`**: For local development on your laptop. This file is checked into version control and contains default settings.
- **`.env.prod`**: For the production environment on your server. This file is **not** checked into version control for security reasons. A template file, `.env.prod.template`, is provided to guide you in creating your own production configuration.

## Local Development Setup (Laptop)

To run the application in your local development environment:

1.  **Prerequisites**: Ensure you have Docker and Docker Compose installed on your machine.

2.  **Environment File**: The repository includes a `.env.local` file with default settings for local development. No changes are needed to get started.

3.  **Run the Application**:

    Use the following command to start the application. This command tells Docker Compose to use the `.env.local` file for configuration.

    ```bash
    docker-compose --env-file .env.local up --build
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

3.  **Create Production Environment File**:

    Copy the template to create your production environment file:

    ```bash
    cp .env.prod.template .env.prod
    ```

4.  **Configure Production Variables**:

    Open `.env.prod` with a text editor and replace the placeholder values with your actual production credentials and settings. **It is crucial to use strong, unique passwords for your production database and pgAdmin.**

5.  **Run the Application**:

    Use the following command to start the application in production mode. This command tells Docker Compose to use the `.env.prod` file.

    ```bash
    docker-compose --env-file .env.prod up -d --build
    ```

    The `-d` flag runs the containers in detached mode, which is recommended for production.

6.  **Access the Application**:

    -   **Application**: `http://<your_server_ip>:3010`
    -   **pgAdmin**: `http://<your_server_ip>:8080` (or the port you configured in `.env.prod`)

## Switching Environments

To switch between environments, simply change the `--env-file` argument in your `docker-compose` command. For example, to run with production settings on your local machine for testing:

```bash
docker-compose --env-file .env.prod up --build
```
