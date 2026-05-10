import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAvailableWinesFiltered, getAvailableLocations } from "./db_wine";
import { seedWineDatabase, clearDatabase } from "./test-utils";

describe("Wine DB — winery filter and dual-location matching", () => {
  let seedData: Awaited<ReturnType<typeof seedWineDatabase>>;

  beforeAll(async () => {
    seedData = await seedWineDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  describe("getAvailableWinesFiltered", () => {
    it("returns all available wines when no filters are provided", async () => {
      const wines = await getAvailableWinesFiltered();
      expect(wines).toHaveLength(3);
      const labels = wines.map((w) => w.label).sort();
      expect(labels).toEqual(["Napa Cab", "R5 Cab", "R5 Chardonnay"]);
    });

    it("does not return out-of-stock wines", async () => {
      const wines = await getAvailableWinesFiltered();
      const labels = wines.map((w) => w.label);
      expect(labels).not.toContain("Out of Stock Wine");
    });

    it("filters by winery ID — returns only R5 wines", async () => {
      const wines = await getAvailableWinesFiltered(undefined, [seedData.wineries.r5.wineryId]);
      expect(wines).toHaveLength(2);
      const labels = wines.map((w) => w.label).sort();
      expect(labels).toEqual(["R5 Cab", "R5 Chardonnay"]);
    });

    it("filters by winery ID — returns only Napa wines", async () => {
      const wines = await getAvailableWinesFiltered(undefined, [seedData.wineries.napaWinery.wineryId]);
      expect(wines).toHaveLength(1);
      expect(wines[0].label).toBe("Napa Cab");
    });

    it("filters by winery ID — returns empty array for nonexistent winery", async () => {
      const wines = await getAvailableWinesFiltered(undefined, [999999]);
      expect(wines).toHaveLength(0);
    });

    it("location filter — matches wines by their own locationId (California)", async () => {
      const wines = await getAvailableWinesFiltered([seedData.locations.california.locationId]);
      expect(wines).toHaveLength(3);
      const labels = wines.map((w) => w.label).sort();
      expect(labels).toEqual(["Napa Cab", "R5 Cab", "R5 Chardonnay"]);
    });

    it("location filter — dual-location: matches R5 wines via winery location (Pennsylvania)", async () => {
      // No wine has locationId = PA, but R5 Winery does — R5 wines should still match
      const wines = await getAvailableWinesFiltered([seedData.locations.pa.locationId]);
      expect(wines).toHaveLength(2);
      const labels = wines.map((w) => w.label).sort();
      expect(labels).toEqual(["R5 Cab", "R5 Chardonnay"]);
    });

    it("location filter — ancestor expansion: USA returns all available wines", async () => {
      const wines = await getAvailableWinesFiltered([seedData.locations.usa.locationId]);
      expect(wines).toHaveLength(3);
    });

    it("combined location + winery filter: California + R5 returns only R5 wines", async () => {
      const wines = await getAvailableWinesFiltered(
        [seedData.locations.california.locationId],
        [seedData.wineries.r5.wineryId]
      );
      expect(wines).toHaveLength(2);
      const labels = wines.map((w) => w.label).sort();
      expect(labels).toEqual(["R5 Cab", "R5 Chardonnay"]);
    });

    it("attaches varietals to returned wines", async () => {
      const wines = await getAvailableWinesFiltered(undefined, [seedData.wineries.r5.wineryId]);
      const cab = wines.find((w) => w.label === "R5 Cab");
      expect(cab).toBeDefined();
      expect(cab!.varietals).toHaveLength(1);
      expect(cab!.varietals[0].name).toBe("Cabernet Sauvignon");
    });
  });

  describe("getAvailableLocations", () => {
    it("returns California (wine location)", async () => {
      const locations = await getAvailableLocations();
      const names = locations.map((l) => l.name);
      expect(names).toContain("California");
    });

    it("returns Pennsylvania (winery location, no wine has PA as its own locationId)", async () => {
      const locations = await getAvailableLocations();
      const names = locations.map((l) => l.name);
      expect(names).toContain("Pennsylvania");
    });

    it("returns USA (ancestor of both CA and PA)", async () => {
      const locations = await getAvailableLocations();
      const names = locations.map((l) => l.name);
      expect(names).toContain("USA");
    });

    it("does not return Chester County (no wines or wineries there)", async () => {
      const locations = await getAvailableLocations();
      const names = locations.map((l) => l.name);
      expect(names).not.toContain("Chester County");
    });
  });
});
