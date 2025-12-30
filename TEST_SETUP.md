# Database Testing Setup

This document describes the testing infrastructure for the Beer Menu application's database functions.

## Overview

The test setup provides comprehensive testing for database functions in `server/db.ts` and `server/db_additions.ts`. Tests run against a dedicated PostgreSQL test database to ensure isolation from development data.

## Architecture

### Test Database

A separate PostgreSQL container (`postgres-test`) is configured in `docker-compose.yml` with these features:

- **Isolated Environment**: Runs on port 5433 (configurable) to avoid conflicts with the development database
- **In-Memory Storage**: Uses `tmpfs` for faster tests and automatic cleanup when the container stops
- **No Auto-Restart**: Configured with `restart: "no"` since it's only needed during testing

### Test Files

| File | Purpose |
|------|---------|
| `server/test-utils.ts` | Utilities for database setup, seeding, and cleanup |
| `server/db.test.ts` | Tests for CRUD operations in `db.ts` |
| `server/db_additions.test.ts` | Tests for complex queries in `db_additions.ts` |
| `.env.test` | Environment variables for test database connection |

### Test Data

The `seedDatabase()` function in `test-utils.ts` creates a consistent set of test data including:

- 3 BJCP categories
- 3 menu categories (Light & Crisp, Hoppy, Dark & Roasty)
- 4 beer styles (Pale Ale, IPA, Lager, Stout)
- 3 breweries (Test Brewery A, B, C)
- 5 beers with various statuses (on_tap, bottle_can, out)
- 1 test user

## Running Tests

### Quick Start

Run all tests with automatic database setup and teardown:

```bash
pnpm test:with-db
```

This command will:
1. Start the test database container
2. Run migrations on the test database
3. Execute all tests
4. Stop the test database container

### Manual Control

For more control during development, you can manage the test database manually:

**Start the test database:**
```bash
pnpm test:db:start
# This runs: docker-compose --env-file .env.test up -d postgres-test
```

**Run migrations:**
```bash
pnpm test:db:migrate
```

**Run tests:**
```bash
pnpm test
```

**Watch mode (for development):**
```bash
pnpm test:watch
```

**Stop the test database:**
```bash
pnpm test:db:stop
# This runs: docker-compose --env-file .env.test down postgres-test
```

**Reset the test database:**
```bash
pnpm test:db:reset
# This stops and restarts the test database with a clean state
```

## Test Coverage

### db.ts Tests

Tests for CRUD operations on all entities:

- **User Functions**: `getUserByGoogleId`, `getUserById`, `getUserByEmail`, `upsertUser`
- **BJCP Category Functions**: `getAllBJCPCategories`, `getBJCPCategoryById`, `createBJCPCategory`, `updateBJCPCategory`, `deleteBJCPCategory`
- **Style Functions**: `getAllStyles`, `getStyleById`, `createStyle`, `updateStyle`, `deleteStyle`
- **Brewery Functions**: `getAllBreweries`, `getBreweryById`, `createBrewery`, `updateBrewery`, `deleteBrewery`
- **Beer Functions**: `getAllBeers`, `getBeerById`, `createBeer`, `updateBeer`, `deleteBeer`
- **Menu Category Functions**: `getAllMenuCategories`, `getMenuCategoryById`, `createMenuCategory`, `updateMenuCategory`, `deleteMenuCategory`

### db_additions.ts Tests

Tests for complex filtering and aggregation queries:

- **getAvailableMenuCategories**: Returns menu categories with available beers
- **getBeersByMenuCategory**: Filters beers by menu category
- **getAvailableBreweries**: Filters breweries by menu categories and/or styles
- **getAvailableStyles**: Filters styles by menu categories and/or breweries

Each function is tested with:
- No filters (baseline behavior)
- Single filter
- Multiple filters
- Non-existent data (edge cases)
- Result ordering

## Configuration

### Environment Variables

The `.env.test` file contains test database configuration. All test-related docker-compose commands use the `--env-file .env.test` flag to ensure the test database uses these settings instead of your development environment variables.

```bash
POSTGRES_TEST_USER=test_user
POSTGRES_TEST_PASSWORD=test_password
POSTGRES_TEST_DB=beer_menu_test
POSTGRES_TEST_PORT=5433
DATABASE_URL=postgresql://test_user:test_password@localhost:5433/beer_menu_test
```

### Docker Compose

The `postgres-test` service in `docker-compose.yml`:

```yaml
postgres-test:
  image: postgres:16.11
  container_name: beer_menu_test_db
  restart: "no"
  environment:
    POSTGRES_USER: ${POSTGRES_TEST_USER:-test_user}
    POSTGRES_PASSWORD: ${POSTGRES_TEST_PASSWORD:-test_password}
    POSTGRES_DB: ${POSTGRES_TEST_DB:-beer_menu_test}
  ports:
    - "${POSTGRES_TEST_PORT:-5433}:5432"
  tmpfs:
    - /var/lib/postgresql/data
  networks:
    - beer_network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_TEST_USER:-test_user} -d ${POSTGRES_TEST_DB:-beer_menu_test}"]
    interval: 5s
    timeout: 3s
    retries: 5
```

## CI/CD Integration

To integrate with CI/CD pipelines:

1. Ensure Docker is available in the CI environment
2. Use the `test:with-db` script for automated testing
3. The test database will automatically start, run tests, and clean up

Example GitHub Actions workflow:

```yaml
- name: Run database tests
  run: pnpm test:with-db
```

## Troubleshooting

### Port Conflicts

If port 5433 is already in use, update `POSTGRES_TEST_PORT` in `.env.test` and restart the test database.

### Database Connection Issues

Ensure the test database is running:
```bash
docker ps | grep beer_menu_test_db
```

Check database health:
```bash
docker exec beer_menu_test_db pg_isready -U test_user -d beer_menu_test
```

### Test Data Issues

Reset the test database to clear any corrupted state:
```bash
pnpm test:db:reset
pnpm test:db:migrate
```

## Best Practices

1. **Always use the test database**: Never run tests against the development database
2. **Keep tests isolated**: Each test should work independently of others
3. **Use seed data**: Rely on the seeded data in `test-utils.ts` rather than creating new data in each test
4. **Clean up after tests**: The `afterAll` hook in each test file ensures cleanup
5. **Test edge cases**: Include tests for non-existent IDs, empty results, and boundary conditions

## Future Enhancements

Potential improvements to the test setup:

- Add performance benchmarks for complex queries
- Implement snapshot testing for query results
- Add integration tests for the full API stack
- Create fixtures for different test scenarios
- Add test coverage reporting
