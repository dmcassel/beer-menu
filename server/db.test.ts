import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getUserByGoogleId,
  getUserById,
  getUserByEmail,
  upsertUser,
  getAllBJCPCategories,
  getBJCPCategoryById,
  createBJCPCategory,
  updateBJCPCategory,
  deleteBJCPCategory,
  getAllStyles,
  getStyleById,
  createStyle,
  updateStyle,
  deleteStyle,
  getAllBreweries,
  getBreweryById,
  createBrewery,
  updateBrewery,
  deleteBrewery,
  getAllBeers,
  getAllAvailableBeers,
  getBeerById,
  createBeer,
  updateBeer,
  deleteBeer,
  getAllMenuCategories,
  getMenuCategoryById,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addBeerToMenuCategory,
} from "./db";
import { seedDatabase, clearDatabase } from "./test-utils";

describe("Database Functions - CRUD Operations", () => {
  let seedData: Awaited<ReturnType<typeof seedDatabase>>;

  beforeAll(async () => {
    seedData = await seedDatabase({
      id: "test-google-id-123",
      email: "test-123@example.com",
    });
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe("User Functions", () => {
    it("should get user by Google ID", async () => {
      const user = await getUserByGoogleId("test-google-id-123");
      expect(user).toBeDefined();
      expect(user?.email).toBe("test-123@example.com");
      expect(user?.name).toBe("Test User");
    });

    it("should return undefined for non-existent Google ID", async () => {
      const user = await getUserByGoogleId("non-existent-id");
      expect(user).toBeUndefined();
    });

    it("should get user by ID", async () => {
      const testUser = seedData.users[0];
      const user = await getUserById(testUser.id);
      expect(user).toBeDefined();
      expect(user?.email).toBe("test-123@example.com");
    });

    it("should get user by email", async () => {
      const user = await getUserByEmail("test-123@example.com");
      expect(user).toBeDefined();
      expect(user?.googleId).toBe("test-google-id-123");
    });

    it("should upsert user (insert new)", async () => {
      await upsertUser({
        googleId: "new-google-id",
        email: "new@example.com",
        name: "New User",
        role: "user",
      });

      const user = await getUserByGoogleId("new-google-id");
      expect(user).toBeDefined();
      expect(user?.email).toBe("new@example.com");
    });

    it("should upsert user (update existing)", async () => {
      await upsertUser({
        googleId: "test-google-id-123",
        email: "test-123@example.com",
        name: "Updated Test User",
      });

      const user = await getUserByGoogleId("test-google-id-123");
      expect(user).toBeDefined();
      expect(user?.name).toBe("Updated Test User");
    });
  });

  describe("BJCP Category Functions", () => {
    it("should get all BJCP categories", async () => {
      const categories = await getAllBJCPCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should get BJCP category by ID", async () => {
      const testCategory = seedData.bjcpCategories[0];
      const category = await getBJCPCategoryById(testCategory.bjcpId);
      expect(category).toBeDefined();
      expect(category?.label).toBe("1A");
    });

    it("should create BJCP category", async () => {
      const result = await createBJCPCategory({
        label: "9C",
        name: "Baltic Porter",
      });
      expect(result).toBeDefined();
    });

    it("should update BJCP category", async () => {
      const testCategory = seedData.bjcpCategories[0];
      await updateBJCPCategory(testCategory.bjcpId, {
        name: "Updated Light Lager",
      });

      const updated = await getBJCPCategoryById(testCategory.bjcpId);
      expect(updated?.name).toBe("Updated Light Lager");
    });

    it("should delete BJCP category", async () => {
      const newCategory = await createBJCPCategory({
        label: "TEST",
        name: "Test Category",
      });

      // Get the inserted ID (this depends on your Drizzle setup)
      const allCategories = await getAllBJCPCategories();
      const testCat = allCategories.find((c) => c.label === "TEST");
      expect(testCat).toBeDefined();

      await deleteBJCPCategory(testCat!.bjcpId);

      const deleted = await getBJCPCategoryById(testCat!.bjcpId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Style Functions", () => {
    it("should get all styles", async () => {
      const styles = await getAllStyles();
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    });

    it("should get style by ID", async () => {
      const testStyle = seedData.styles[0];
      const style = await getStyleById(testStyle.styleId);
      expect(style).toBeDefined();
      expect(style?.name).toBe("Pale Ale");
    });

    it("should create style", async () => {
      const result = await createStyle({
        name: "New Style",
        description: "A new beer style",
      });
      expect(result).toBeDefined();
    });

    it("should update style", async () => {
      const testStyle = seedData.styles[0];
      await updateStyle(testStyle.styleId, {
        description: "Updated description",
      });

      const updated = await getStyleById(testStyle.styleId);
      expect(updated?.description).toBe("Updated description");
    });

    it("should delete style", async () => {
      const newStyle = await createStyle({
        name: "Temporary Style",
        description: "Will be deleted",
      });

      const allStyles = await getAllStyles();
      const tempStyle = allStyles.find((s) => s.name === "Temporary Style");
      expect(tempStyle).toBeDefined();

      await deleteStyle(tempStyle!.styleId);

      const deleted = await getStyleById(tempStyle!.styleId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Brewery Functions", () => {
    it("should get all breweries", async () => {
      const breweries = await getAllBreweries();
      expect(Array.isArray(breweries)).toBe(true);
      expect(breweries.length).toBeGreaterThan(0);
    });

    it("should get brewery by ID", async () => {
      const testBrewery = seedData.breweries[0];
      const brewery = await getBreweryById(testBrewery.breweryId);
      expect(brewery).toBeDefined();
      expect(brewery?.name).toBe("Test Brewery A");
    });

    it("should create brewery", async () => {
      const result = await createBrewery({
        name: "New Brewery",
        location: "Portland, OR",
      });
      expect(result).toBeDefined();
    });

    it("should update brewery", async () => {
      const testBrewery = seedData.breweries[0];
      await updateBrewery(testBrewery.breweryId, {
        location: "Updated Location",
      });

      const updated = await getBreweryById(testBrewery.breweryId);
      expect(updated?.location).toBe("Updated Location");
    });

    it("should delete brewery", async () => {
      const newBrewery = await createBrewery({
        name: "Temporary Brewery",
        location: "Nowhere",
      });

      const allBreweries = await getAllBreweries();
      const tempBrewery = allBreweries.find((b) => b.name === "Temporary Brewery");
      expect(tempBrewery).toBeDefined();

      await deleteBrewery(tempBrewery!.breweryId);

      const deleted = await getBreweryById(tempBrewery!.breweryId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Beer Functions", () => {
    it("should get all beers", async () => {
      const beers = await getAllBeers();
      expect(Array.isArray(beers)).toBe(true);
      expect(beers.length).toBeGreaterThan(0);
    });

    it("should get beer by ID", async () => {
      const testBeer = seedData.beers[0];
      const beer = await getBeerById(testBeer.beerId);
      expect(beer).toBeDefined();
      expect(beer?.name).toBe("Hoppy Pale Ale");
    });

    it("should return all beers when no filters provided", async () => {
      const beers = await getAllBeers({});
      expect(beers.length).toBe(5);
    });

    it("should filter by text search on beer name", async () => {
      const beers = await getAllBeers({ search: "Hoppy" });
      expect(beers.length).toBe(1);
      expect(beers[0].name).toBe("Hoppy Pale Ale");
    });

    it("should filter by text search on brewery name", async () => {
      const beers = await getAllBeers({ search: "Test Brewery A" });
      expect(beers.length).toBe(2);
      const names = beers.map((b) => b.name);
      expect(names).toContain("Hoppy Pale Ale");
      expect(names).toContain("West Coast IPA");
    });

    it("should match diacritic characters when searching without them", async () => {
      const testStyle = seedData.styles[0];
      await createBrewery({ name: "Tröegs Independent Brewing" });
      const accentedBrewery = (await getAllBreweries()).find((b) => b.name === "Tröegs Independent Brewing")!;
      await createBeer({
        name: "Rosé Ale",
        breweryId: accentedBrewery.breweryId,
        styleId: testStyle.styleId,
        status: "on_tap",
      });
      const accentedBeer = (await getAllBeers()).find((b) => b.name === "Rosé Ale")!;

      const byBeerName = await getAllBeers({ search: "rose" });
      expect(byBeerName.some((b) => b.name === "Rosé Ale")).toBe(true);

      const byBreweryName = await getAllBeers({ search: "troegs" });
      expect(byBreweryName.some((b) => b.name === "Rosé Ale")).toBe(true);

      await deleteBeer(accentedBeer.beerId);
      await deleteBrewery(accentedBrewery.breweryId);
    });

    it("should filter by styleId", async () => {
      const ipaStyle = seedData.styles[1];
      const beers = await getAllBeers({ styleIds: [ipaStyle.styleId] });
      expect(beers.length).toBe(1);
      expect(beers[0].name).toBe("West Coast IPA");
    });

    it("should filter by breweryId", async () => {
      const breweryB = seedData.breweries[1];
      const beers = await getAllBeers({ breweryIds: [breweryB.breweryId] });
      expect(beers.length).toBe(2);
      const names = beers.map((b) => b.name);
      expect(names).toContain("Crisp Lager");
      expect(names).toContain("Out of Stock Beer");
    });

    it("should filter by menuCategoryId", async () => {
      const hoppy = seedData.beers[0];
      const hoppyCat = seedData.menuCategories[1];
      await addBeerToMenuCategory({
        beerId: hoppy.beerId,
        menuCatId: hoppyCat.menuCatId,
      });
      const beers = await getAllBeers({ menuCategoryIds: [hoppyCat.menuCatId] });
      expect(beers.length).toBe(1);
      expect(beers[0].name).toBe("Hoppy Pale Ale");
    });

    it("should return empty array when no beers match search", async () => {
      const beers = await getAllBeers({ search: "zzznomatch" });
      expect(beers.length).toBe(0);
    });

    it("should AND multiple filters together", async () => {
      const breweryA = seedData.breweries[0];
      const beers = await getAllBeers({
        breweryIds: [breweryA.breweryId],
        search: "IPA",
      });
      expect(beers.length).toBe(1);
      expect(beers[0].name).toBe("West Coast IPA");
    });

    it("should get available beers with brewery name, excluding out-of-stock beers", async () => {
      const beers = await getAllAvailableBeers();
      expect(beers.length).toBe(4);
      expect(beers.some((b) => b.name === "Out of Stock Beer")).toBe(false);

      const hoppy = beers.find((b) => b.name === "Hoppy Pale Ale");
      expect(hoppy?.breweryName).toBe("Test Brewery A");
    });

    it("should create beer", async () => {
      const testBrewery = seedData.breweries[0];
      const testStyle = seedData.styles[0];

      const result = await createBeer({
        name: "New Beer",
        description: "A new beer",
        breweryId: testBrewery.breweryId,
        styleId: testStyle.styleId,
        abv: "5.0",
        ibu: 40,
        status: "on_tap",
      });
      expect(result).toBeDefined();
    });

    it("should update beer", async () => {
      const testBeer = seedData.beers[0];
      await updateBeer(testBeer.beerId, {
        description: "Updated beer description",
      });

      const updated = await getBeerById(testBeer.beerId);
      expect(updated?.description).toBe("Updated beer description");
    });

    it("should delete beer", async () => {
      const testBrewery = seedData.breweries[0];
      const testStyle = seedData.styles[0];

      const newBeer = await createBeer({
        name: "Temporary Beer",
        breweryId: testBrewery.breweryId,
        styleId: testStyle.styleId,
        status: "out",
      });

      const allBeers = await getAllBeers();
      const tempBeer = allBeers.find((b) => b.name === "Temporary Beer");
      expect(tempBeer).toBeDefined();

      await deleteBeer(tempBeer!.beerId);

      const deleted = await getBeerById(tempBeer!.beerId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Menu Category Functions", () => {
    it("should get all menu categories", async () => {
      const categories = await getAllMenuCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should get menu category by ID", async () => {
      const testCategory = seedData.menuCategories[0];
      const category = await getMenuCategoryById(testCategory.menuCatId);
      expect(category).toBeDefined();
      expect(category?.name).toBe("Light & Crisp");
    });

    it("should create menu category", async () => {
      const result = await createMenuCategory({
        name: "New Category",
        description: "A new menu category",
      });
      expect(result).toBeDefined();
    });

    it("should update menu category", async () => {
      const testCategory = seedData.menuCategories[0];
      await updateMenuCategory(testCategory.menuCatId, {
        description: "Updated description",
      });

      const updated = await getMenuCategoryById(testCategory.menuCatId);
      expect(updated?.description).toBe("Updated description");
    });

    it("should delete menu category", async () => {
      const newCategory = await createMenuCategory({
        name: "Temporary Category",
        description: "Will be deleted",
      });

      const allCategories = await getAllMenuCategories();
      const tempCategory = allCategories.find((c) => c.name === "Temporary Category");
      expect(tempCategory).toBeDefined();

      await deleteMenuCategory(tempCategory!.menuCatId);

      const deleted = await getMenuCategoryById(tempCategory!.menuCatId);
      expect(deleted).toBeUndefined();
    });
  });
});
