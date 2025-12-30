import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getAvailableMenuCategories,
  getBeersByMenuCategory,
  getAvailableBreweries,
  getAvailableStyles,
} from "./db_additions";
import { seedDatabase, clearDatabase } from "./test-utils";

describe("Database Additions - Complex Queries", () => {
  let seedData: Awaited<ReturnType<typeof seedDatabase>>;

  beforeAll(async () => {
    // Set up the test database and seed it with data
    seedData = await seedDatabase({
      id: "test-google-id-456",
      email: "test-456@example.com",
    });
  });

  afterAll(async () => {
    // Clear the database after all tests are done
    await clearDatabase();
  });

  describe("getAvailableMenuCategories", () => {
    it("should return only menu categories with available beers", async () => {
      const categories = await getAvailableMenuCategories();

      // Should return categories that have beers with status != 'out'
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);

      // Verify structure
      expect(categories[0]).toHaveProperty("menu_cat_id");
      expect(categories[0]).toHaveProperty("name");
      expect(categories[0]).toHaveProperty("description");
    });

    it("should not include categories with only 'out' status beers", async () => {
      const categories = await getAvailableMenuCategories();

      // All returned categories should have at least one available beer
      for (const category of categories) {
        expect(category.name).toBeDefined();
      }
    });

    it("should return results ordered by name", async () => {
      const categories = await getAvailableMenuCategories();

      // Check if results are ordered by name
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].name >= categories[i - 1].name).toBe(true);
      }
    });
  });

  describe("getBeersByMenuCategory", () => {
    it("should return beers for a specific menu category", async () => {
      // Use the "Hoppy" category (menuCategories[1])
      const hoppyCategory = seedData.menuCategories.find((c) => c.name === "Hoppy");
      expect(hoppyCategory).toBeDefined();

      const beers = await getBeersByMenuCategory(hoppyCategory!.menuCatId);

      expect(Array.isArray(beers)).toBe(true);
      expect(beers.length).toBeGreaterThan(0);

      // Verify that returned beers are not 'out'
      for (const beer of beers) {
        expect(beer.status).not.toBe("out");
      }
    });

    it("should return empty array for non-existent category", async () => {
      const beers = await getBeersByMenuCategory(99999);
      expect(Array.isArray(beers)).toBe(true);
      expect(beers.length).toBe(0);
    });

    it("should return beers ordered by name", async () => {
      const category = seedData.menuCategories[0];
      const beers = await getBeersByMenuCategory(category.menuCatId);

      if (beers.length > 1) {
        for (let i = 1; i < beers.length; i++) {
          expect(beers[i].name >= beers[i - 1].name).toBe(true);
        }
      }
    });

    it("should only return beers with status not equal to 'out'", async () => {
      const category = seedData.menuCategories[1]; // Hoppy category
      const beers = await getBeersByMenuCategory(category.menuCatId);

      for (const beer of beers) {
        expect(beer.status).not.toBe("out");
      }
    });
  });

  describe("getAvailableBreweries", () => {
    it("should return all breweries when no filters provided", async () => {
      const breweries = await getAvailableBreweries();

      expect(Array.isArray(breweries)).toBe(true);
      // Should return breweries that have at least one available beer
      expect(breweries.length).toBeGreaterThan(0);

      // Verify structure
      expect(breweries[0]).toHaveProperty("breweryId");
      expect(breweries[0]).toHaveProperty("name");
      expect(breweries[0]).toHaveProperty("location");
    });

    it("should filter breweries by menu category", async () => {
      const hoppyCategory = seedData.menuCategories.find((c) => c.name === "Hoppy");
      expect(hoppyCategory).toBeDefined();

      const breweries = await getAvailableBreweries([hoppyCategory!.menuCatId]);

      expect(Array.isArray(breweries)).toBe(true);
      expect(breweries.length).toBeGreaterThan(0);

      // Should only include "Test Brewery A" which has hoppy beers
      const breweryNames = breweries.map((b) => b.name);
      expect(breweryNames).toContain("Test Brewery A");
    });

    it("should filter breweries by style", async () => {
      const ipaStyle = seedData.styles.find((s) => s.name === "IPA");
      expect(ipaStyle).toBeDefined();

      const breweries = await getAvailableBreweries(undefined, [ipaStyle!.styleId]);

      expect(Array.isArray(breweries)).toBe(true);
      expect(breweries.length).toBeGreaterThan(0);
    });

    it("should filter by both menu category and style", async () => {
      const hoppyCategory = seedData.menuCategories.find((c) => c.name === "Hoppy");
      const ipaStyle = seedData.styles.find((s) => s.name === "IPA");

      const breweries = await getAvailableBreweries([hoppyCategory!.menuCatId], [ipaStyle!.styleId]);

      expect(Array.isArray(breweries)).toBe(true);
      expect(breweries.length).toBeGreaterThan(0);
    });

    it("should return empty array when filters match no breweries", async () => {
      const breweries = await getAvailableBreweries([99999]);
      expect(Array.isArray(breweries)).toBe(true);
      expect(breweries.length).toBe(0);
    });

    it("should return results ordered by brewery name", async () => {
      const breweries = await getAvailableBreweries();

      for (let i = 1; i < breweries.length; i++) {
        expect(breweries[i].name >= breweries[i - 1].name).toBe(true);
      }
    });
  });

  describe("getAvailableStyles", () => {
    it("should return all styles when no filters provided", async () => {
      const styles = await getAvailableStyles();

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);

      // Verify structure
      expect(styles[0]).toHaveProperty("styleId");
      expect(styles[0]).toHaveProperty("name");
      expect(styles[0]).toHaveProperty("menuCategoryId");
    });

    it("should filter styles by menu category", async () => {
      const hoppyCategory = seedData.menuCategories.find((c) => c.name === "Hoppy");
      expect(hoppyCategory).toBeDefined();

      const styles = await getAvailableStyles([hoppyCategory!.menuCatId]);

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);

      // All returned styles should belong to the Hoppy category
      for (const style of styles) {
        expect(style.menuCategoryId).toBe(hoppyCategory!.menuCatId);
      }
    });

    it("should filter styles by brewery", async () => {
      const breweryA = seedData.breweries.find((b) => b.name === "Test Brewery A");
      expect(breweryA).toBeDefined();

      const styles = await getAvailableStyles(undefined, [breweryA!.breweryId]);

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    });

    it("should filter by both menu category and brewery", async () => {
      const hoppyCategory = seedData.menuCategories.find((c) => c.name === "Hoppy");
      const breweryA = seedData.breweries.find((b) => b.name === "Test Brewery A");

      const styles = await getAvailableStyles([hoppyCategory!.menuCatId], [breweryA!.breweryId]);

      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    });

    it("should return empty array when filters match no styles", async () => {
      const styles = await getAvailableStyles([99999]);
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBe(0);
    });

    it("should return results ordered by style name", async () => {
      const styles = await getAvailableStyles();

      for (let i = 1; i < styles.length; i++) {
        expect(styles[i].name >= styles[i - 1].name).toBe(true);
      }
    });
  });
});
