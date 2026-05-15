import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAllWines, getAvailableWinesFiltered, getAvailableLocations, getAvailableWineries } from "./db_wine";
import { seedWineDatabase, clearDatabase } from "./test-utils";

describe("getAllWines — curator filters", () => {
  let seedData: Awaited<ReturnType<typeof seedWineDatabase>>;

  beforeAll(async () => {
    seedData = await seedWineDatabase();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it("returns all wines including out-of-stock when no filters given", async () => {
    const wines = await getAllWines();
    expect(wines).toHaveLength(4);
    const labels = wines.map(w => w.label).sort();
    expect(labels).toEqual(["Napa Cab", "Out of Stock Wine", "R5 Cab", "R5 Chardonnay"]);
  });

  it("winery filter — single winery returns only that winery's wines", async () => {
    const wines = await getAllWines({ wineryIds: [seedData.wineries.r5.wineryId] });
    expect(wines).toHaveLength(3);
    const labels = wines.map(w => w.label).sort();
    expect(labels).toEqual(["Out of Stock Wine", "R5 Cab", "R5 Chardonnay"]);
  });

  it("winery filter — multiple wineries use OR semantics within the dimension", async () => {
    const wines = await getAllWines({
      wineryIds: [seedData.wineries.r5.wineryId, seedData.wineries.napaWinery.wineryId],
    });
    expect(wines).toHaveLength(4);
  });

  it("location filter — California matches wines by their own locationId", async () => {
    const wines = await getAllWines({ locationIds: [seedData.locations.california.locationId] });
    expect(wines).toHaveLength(4);
  });

  it("location filter — Pennsylvania matches R5 wines via winery location", async () => {
    const wines = await getAllWines({ locationIds: [seedData.locations.pa.locationId] });
    expect(wines).toHaveLength(3);
    const labels = wines.map(w => w.label).sort();
    expect(labels).toEqual(["Out of Stock Wine", "R5 Cab", "R5 Chardonnay"]);
  });

  it("location filter — USA ancestor expansion returns all wines", async () => {
    const wines = await getAllWines({ locationIds: [seedData.locations.usa.locationId] });
    expect(wines).toHaveLength(4);
  });

  it("text search — matches wine label (case-insensitive)", async () => {
    const wines = await getAllWines({ search: "napa" });
    expect(wines).toHaveLength(1);
    expect(wines[0].label).toBe("Napa Cab");
  });

  it("text search — matches winery name", async () => {
    const wines = await getAllWines({ search: "R5" });
    expect(wines).toHaveLength(3);
    const labels = wines.map(w => w.label).sort();
    expect(labels).toEqual(["Out of Stock Wine", "R5 Cab", "R5 Chardonnay"]);
  });

  it("text search — matches varietal name", async () => {
    // 'Cabernet' appears only in the varietal name, not in any label or winery name
    const wines = await getAllWines({ search: "Cabernet" });
    expect(wines).toHaveLength(2);
    const labels = wines.map(w => w.label).sort();
    expect(labels).toEqual(["Napa Cab", "R5 Cab"]);
  });

  it("winery + location filters use AND semantics across dimensions", async () => {
    // R5 wines match Pennsylvania; Napa winery does not → 0 results
    const wines = await getAllWines({
      wineryIds: [seedData.wineries.napaWinery.wineryId],
      locationIds: [seedData.locations.pa.locationId],
    });
    expect(wines).toHaveLength(0);
  });

  it("winery + text search use AND semantics across dimensions", async () => {
    // R5 winery AND search 'cab' → only R5 Cab
    const wines = await getAllWines({
      wineryIds: [seedData.wineries.r5.wineryId],
      search: "cab",
    });
    expect(wines).toHaveLength(1);
    expect(wines[0].label).toBe("R5 Cab");
  });

  it("attaches varietals to returned wines", async () => {
    const wines = await getAllWines({ wineryIds: [seedData.wineries.r5.wineryId] });
    const cab = wines.find(w => w.label === "R5 Cab");
    expect(cab).toBeDefined();
    expect(cab!.varietals).toHaveLength(1);
    expect(cab!.varietals[0].name).toBe("Cabernet Sauvignon");
  });
});

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

  describe("getAvailableWineries", () => {
    it("returns R5 Winery (has in-stock wines)", async () => {
      const wineries = await getAvailableWineries();
      const names = wineries.map((w) => w.name);
      expect(names).toContain("R5 Winery");
    });

    it("returns Napa Valley Winery (has in-stock wines)", async () => {
      const wineries = await getAvailableWineries();
      const names = wineries.map((w) => w.name);
      expect(names).toContain("Napa Valley Winery");
    });

    it("does not return Empty Winery (no wines)", async () => {
      const wineries = await getAvailableWineries();
      const names = wineries.map((w) => w.name);
      expect(names).not.toContain("Empty Winery");
    });

    it("returns wineries ordered by name", async () => {
      const wineries = await getAvailableWineries();
      const names = wineries.map((w) => w.name);
      expect(names).toEqual([...names].sort());
    });
  });
});
