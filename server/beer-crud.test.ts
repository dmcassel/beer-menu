import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock authenticated user context
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Beer Catalog CRUD Operations", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testBjcpId: number | null = null;
  let testStyleId: number | null = null;
  let testBreweryId: number | null = null;
  let testBeerId: number | null = null;
  let testMenuCatId: number | null = null;

  beforeAll(() => {
    caller = appRouter.createCaller(createAuthContext());
  });

  describe("BJCP Category CRUD", () => {
    it("should create a BJCP category", async () => {
      const result = await caller.bjcpCategory.create({
        label: "1A",
        name: "Light Lager",
      });
      expect(result).toBeDefined();
      if (result && typeof result === "object" && "insertId" in result) {
        testBjcpId = (result as any).insertId;
      }
    });

    it("should list all BJCP categories", async () => {
      const categories = await caller.bjcpCategory.list();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should get a BJCP category by ID", async () => {
      if (testBjcpId) {
        const category = await caller.bjcpCategory.getById({ id: testBjcpId });
        expect(category).toBeDefined();
        expect(category?.label).toBe("1A");
      }
    });

    it("should update a BJCP category", async () => {
      if (testBjcpId) {
        await caller.bjcpCategory.update({
          id: testBjcpId,
          name: "Updated Light Lager",
        });
        const updated = await caller.bjcpCategory.getById({ id: testBjcpId });
        expect(updated?.name).toBe("Updated Light Lager");
      }
    });
  });

  describe("Style CRUD", () => {
    it("should create a style", async () => {
      const result = await caller.style.create({
        name: "Pale Ale",
        description: "A classic pale ale style",
        bjcpId: testBjcpId || undefined,
      });
      expect(result).toBeDefined();
      if (result && typeof result === "object" && "insertId" in result) {
        testStyleId = (result as any).insertId;
      }
    });

    it("should list all styles", async () => {
      const styles = await caller.style.list();
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    });

    it("should get a style by ID", async () => {
      if (testStyleId) {
        const style = await caller.style.getById({ id: testStyleId });
        expect(style).toBeDefined();
        expect(style?.name).toBe("Pale Ale");
      }
    });

    it("should update a style", async () => {
      if (testStyleId) {
        await caller.style.update({
          id: testStyleId,
          description: "Updated description",
        });
        const updated = await caller.style.getById({ id: testStyleId });
        expect(updated?.description).toBe("Updated description");
      }
    });
  });

  describe("Brewery CRUD", () => {
    it("should create a brewery", async () => {
      const result = await caller.brewery.create({
        name: "Test Brewery",
        location: "Boulder, CO",
      });
      expect(result).toBeDefined();
      if (result && typeof result === "object" && "insertId" in result) {
        testBreweryId = (result as any).insertId;
      }
    });

    it("should list all breweries", async () => {
      const breweries = await caller.brewery.list();
      expect(Array.isArray(breweries)).toBe(true);
      expect(breweries.length).toBeGreaterThan(0);
    });

    it("should get a brewery by ID", async () => {
      if (testBreweryId) {
        const brewery = await caller.brewery.getById({ id: testBreweryId });
        expect(brewery).toBeDefined();
        expect(brewery?.name).toBe("Test Brewery");
      }
    });

    it("should update a brewery", async () => {
      if (testBreweryId) {
        await caller.brewery.update({
          id: testBreweryId,
          location: "Denver, CO",
        });
        const updated = await caller.brewery.getById({ id: testBreweryId });
        expect(updated?.location).toBe("Denver, CO");
      }
    });
  });

  describe("Beer CRUD", () => {
    it("should create a beer", async () => {
      const result = await caller.beer.create({
        name: "Test IPA",
        description: "A test IPA beer",
        breweryId: testBreweryId || undefined,
        styleId: testStyleId || undefined,
        abv: "6.5",
        ibu: 60,
      });
      expect(result).toBeDefined();
      if (result && typeof result === "object" && "insertId" in result) {
        testBeerId = (result as any).insertId;
      }
    });

    it("should list all beers", async () => {
      const beers = await caller.beer.list();
      expect(Array.isArray(beers)).toBe(true);
      expect(beers.length).toBeGreaterThan(0);
    });

    it("should get a beer by ID", async () => {
      if (testBeerId) {
        const beer = await caller.beer.getById({ id: testBeerId });
        expect(beer).toBeDefined();
        expect(beer?.name).toBe("Test IPA");
      }
    });

    it("should update a beer", async () => {
      if (testBeerId) {
        await caller.beer.update({
          id: testBeerId,
          ibu: 65,
        });
        const updated = await caller.beer.getById({ id: testBeerId });
        expect(updated?.ibu).toBe(65);
      }
    });
  });

  describe("Menu Category CRUD", () => {
    it("should create a menu category", async () => {
      const result = await caller.menuCategory.create({
        name: "Seasonal Beers",
        description: "Our seasonal beer selection",
      });
      expect(result).toBeDefined();
      if (result && typeof result === "object" && "insertId" in result) {
        testMenuCatId = (result as any).insertId;
      }
    });

    it("should list all menu categories", async () => {
      const categories = await caller.menuCategory.list();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should get a menu category by ID", async () => {
      if (testMenuCatId) {
        const category = await caller.menuCategory.getById({ id: testMenuCatId });
        expect(category).toBeDefined();
        expect(category?.name).toBe("Seasonal Beers");
      }
    });

    it("should update a menu category", async () => {
      if (testMenuCatId) {
        await caller.menuCategory.update({
          id: testMenuCatId,
          description: "Updated seasonal selection",
        });
        const updated = await caller.menuCategory.getById({ id: testMenuCatId });
        expect(updated?.description).toBe("Updated seasonal selection");
      }
    });
  });

  describe("Menu Category Beer Association", () => {
    it("should add a beer to a menu category", async () => {
      if (testMenuCatId && testBeerId) {
        await caller.menuCategoryBeer.addBeerToCategory({
          menuCatId: testMenuCatId,
          beerId: testBeerId,
        });
        const beers = await caller.menuCategoryBeer.getBeersInCategory({
          menuCatId: testMenuCatId,
        });
        expect(beers.length).toBeGreaterThan(0);
        expect(beers.some((b) => b.beerId === testBeerId)).toBe(true);
      }
    });

    it("should get beers in a menu category", async () => {
      if (testMenuCatId) {
        const beers = await caller.menuCategoryBeer.getBeersInCategory({
          menuCatId: testMenuCatId,
        });
        expect(Array.isArray(beers)).toBe(true);
      }
    });

    it("should remove a beer from a menu category", async () => {
      if (testMenuCatId && testBeerId) {
        await caller.menuCategoryBeer.removeBeerFromCategory({
          menuCatId: testMenuCatId,
          beerId: testBeerId,
        });
        const beers = await caller.menuCategoryBeer.getBeersInCategory({
          menuCatId: testMenuCatId,
        });
        expect(beers.some((b) => b.beerId === testBeerId)).toBe(false);
      }
    });
  });

  describe("Cleanup - Delete Operations", () => {
    it("should delete a beer", async () => {
      if (testBeerId) {
        await caller.beer.delete({ id: testBeerId });
        const beer = await caller.beer.getById({ id: testBeerId });
        expect(beer).toBeUndefined();
      }
    });

    it("should delete a menu category", async () => {
      if (testMenuCatId) {
        await caller.menuCategory.delete({ id: testMenuCatId });
        const category = await caller.menuCategory.getById({ id: testMenuCatId });
        expect(category).toBeUndefined();
      }
    });

    it("should delete a brewery", async () => {
      if (testBreweryId) {
        await caller.brewery.delete({ id: testBreweryId });
        const brewery = await caller.brewery.getById({ id: testBreweryId });
        expect(brewery).toBeUndefined();
      }
    });

    it("should delete a style", async () => {
      if (testStyleId) {
        await caller.style.delete({ id: testStyleId });
        const style = await caller.style.getById({ id: testStyleId });
        expect(style).toBeUndefined();
      }
    });

    it("should delete a BJCP category", async () => {
      if (testBjcpId) {
        await caller.bjcpCategory.delete({ id: testBjcpId });
        const category = await caller.bjcpCategory.getById({ id: testBjcpId });
        expect(category).toBeUndefined();
      }
    });
  });
});
