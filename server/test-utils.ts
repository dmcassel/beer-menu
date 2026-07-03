import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import {
  brewery,
  style,
  beer,
  menuCategory,
  bjcpCategory,
  users,
  location,
  winery,
  wine,
  varietal,
  wineVarietal,
} from "../drizzle/schema";

let testDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get the test database instance
 */
export async function getTestDb() {
  if (!testDb && process.env.DATABASE_URL) {
    testDb = drizzle(process.env.DATABASE_URL);
  }
  return testDb;
}

/**
 * Clear all test data from the database
 */
export async function clearDatabase() {
  const db = await getTestDb();
  if (!db) throw new Error("Test database not available");

  // Clear all tables in reverse dependency order
  await db.execute(sql`TRUNCATE TABLE wine_varietal CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE wine CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE varietal CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE winery CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE location CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE menu_category_beer CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE beer CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE brewery CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE style CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE menu_category CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE bjcp_category CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
}

export interface User {
  id: string;
  email: string;
}

/**
 * Seed the database with test data
 * Returns IDs of created entities for use in tests
 */
export async function seedDatabase(user: User) {
  const db = await getTestDb();
  if (!db) throw new Error("Test database not available");

  // Clear existing data first
  await clearDatabase();

  // Create BJCP categories
  const bjcpCategories = await db
    .insert(bjcpCategory)
    .values([
      { label: "1A", name: "American Light Lager" },
      { label: "5B", name: "Kölsch" },
      { label: "10A", name: "Weissbier" },
    ])
    .returning();

  // Create menu categories
  const menuCategories = await db
    .insert(menuCategory)
    .values([
      { name: "Light & Crisp", description: "Refreshing light beers" },
      { name: "Hoppy", description: "Hop-forward beers" },
      { name: "Dark & Roasty", description: "Dark beers with roasted flavors" },
    ])
    .returning();

  // Create styles
  const styles = await db
    .insert(style)
    .values([
      {
        name: "Pale Ale",
        description: "A classic pale ale style",
        bjcpId: bjcpCategories[0].bjcpId,
        menuCategoryId: menuCategories[1].menuCatId,
      },
      {
        name: "IPA",
        description: "India Pale Ale",
        bjcpId: bjcpCategories[0].bjcpId,
        menuCategoryId: menuCategories[1].menuCatId,
      },
      {
        name: "Lager",
        description: "Light lager",
        bjcpId: bjcpCategories[1].bjcpId,
        menuCategoryId: menuCategories[0].menuCatId,
      },
      {
        name: "Stout",
        description: "Dark stout",
        bjcpId: bjcpCategories[2].bjcpId,
        menuCategoryId: menuCategories[2].menuCatId,
      },
    ])
    .returning();

  // Create breweries
  const breweries = await db
    .insert(brewery)
    .values([
      { name: "Test Brewery A", location: "Boulder, CO" },
      { name: "Test Brewery B", location: "Denver, CO" },
      { name: "Test Brewery C", location: "Fort Collins, CO" },
    ])
    .returning();

  // Create beers
  const beers = await db
    .insert(beer)
    .values([
      {
        name: "Hoppy Pale Ale",
        description: "A hoppy pale ale",
        breweryId: breweries[0].breweryId,
        styleId: styles[0].styleId,
        abv: "5.5",
        ibu: 45,
        status: "on_tap",
      },
      {
        name: "West Coast IPA",
        description: "Classic West Coast IPA",
        breweryId: breweries[0].breweryId,
        styleId: styles[1].styleId,
        abv: "6.8",
        ibu: 70,
        status: "on_tap",
      },
      {
        name: "Crisp Lager",
        description: "Refreshing lager",
        breweryId: breweries[1].breweryId,
        styleId: styles[2].styleId,
        abv: "4.5",
        ibu: 20,
        status: "on_tap",
      },
      {
        name: "Dark Stout",
        description: "Rich dark stout",
        breweryId: breweries[2].breweryId,
        styleId: styles[3].styleId,
        abv: "7.2",
        ibu: 35,
        status: "bottle_can",
      },
      {
        name: "Out of Stock Beer",
        description: "This beer is out",
        breweryId: breweries[1].breweryId,
        styleId: styles[0].styleId,
        abv: "5.0",
        ibu: 30,
        status: "out",
      },
    ])
    .returning();

  // Create a test user
  const testUsers = await db
    .insert(users)
    .values([
      {
        googleId: user.id,
        email: user.email,
        name: "Test User",
        role: "user",
      },
    ])
    .returning();

  return {
    bjcpCategories,
    menuCategories,
    styles,
    breweries,
    beers,
    users: testUsers,
  };
}

/**
 * Seed wine-specific test data.
 * Models the dual-location scenario: R5 Winery is in PA but makes wines from CA grapes.
 * Returns all created entities for use in assertions.
 */
export async function seedWineDatabase() {
  const db = await getTestDb();
  if (!db) throw new Error("Test database not available");

  await clearDatabase();

  const locations = await db
    .insert(location)
    .values([{ name: "USA", type: "country", parentId: null }])
    .returning();
  const usa = locations[0];

  const areas = await db
    .insert(location)
    .values([
      { name: "Pennsylvania", type: "area", parentId: usa.locationId },
      { name: "California", type: "area", parentId: usa.locationId },
    ])
    .returning();
  const pa = areas[0];
  const california = areas[1];

  const subAreas = await db
    .insert(location)
    .values([{ name: "Chester County", type: "vineyard", parentId: pa.locationId }])
    .returning();
  const chesterCounty = subAreas[0];

  const wineries = await db
    .insert(winery)
    .values([
      { name: "R5 Winery", locationId: pa.locationId },
      { name: "Napa Valley Winery", locationId: california.locationId },
      { name: "Empty Winery" },
    ])
    .returning();
  const r5 = wineries[0];
  const napaWinery = wineries[1];
  const emptyWinery = wineries[2];

  const varietals = await db
    .insert(varietal)
    .values([{ name: "Cabernet Sauvignon" }, { name: "Chardonnay" }])
    .returning();
  const cab = varietals[0];
  const chard = varietals[1];

  const wines = await db
    .insert(wine)
    .values([
      { label: "R5 Cab", wineryId: r5.wineryId, locationId: california.locationId, refrigerated: 3, cellared: 0 },
      {
        label: "R5 Chardonnay",
        wineryId: r5.wineryId,
        locationId: california.locationId,
        refrigerated: 0,
        cellared: 5,
      },
      {
        label: "Napa Cab",
        wineryId: napaWinery.wineryId,
        locationId: california.locationId,
        refrigerated: 2,
        cellared: 0,
      },
      {
        label: "Out of Stock Wine",
        wineryId: r5.wineryId,
        locationId: california.locationId,
        refrigerated: 0,
        cellared: 0,
      },
    ])
    .returning();
  const r5Cab = wines[0];
  const r5Chard = wines[1];
  const napaCab = wines[2];
  const outOfStock = wines[3];

  await db.insert(wineVarietal).values([
    { wineId: r5Cab.wineId, varietalId: cab.varietalId },
    { wineId: r5Chard.wineId, varietalId: chard.varietalId },
    { wineId: napaCab.wineId, varietalId: cab.varietalId },
  ]);

  return {
    locations: { usa, pa, california, chesterCounty },
    wineries: { r5, napaWinery, emptyWinery },
    varietals: { cab, chard },
    wines: { r5Cab, r5Chard, napaCab, outOfStock },
  };
}

/**
 * Run database migrations for the test database
 */
export async function runMigrations() {
  const db = await getTestDb();
  if (!db) throw new Error("Test database not available");

  // Import and run migrations
  // This assumes you have migration files in the drizzle/migrations folder
  // You may need to adjust this based on your migration setup
  console.log("Running migrations on test database...");
  // Note: You'll need to implement actual migration running logic here
  // For now, this is a placeholder
}
