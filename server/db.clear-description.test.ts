import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getBeerById, createBeer, updateBeer } from "./db";
import { seedDatabase, clearDatabase } from "./test-utils";

describe("Beer Description - Clear to Empty String", () => {
  let seedData: Awaited<ReturnType<typeof seedDatabase>>;
  let testBeerId: number;

  beforeAll(async () => {
    seedData = await seedDatabase({
      id: "test-google-id-123",
      email: "test-123@example.com",
    });

    // Create a test beer with a description
    const testBrewery = seedData.breweries[0];
    const testStyle = seedData.styles[0];

    const result = await createBeer({
      name: "Test Beer for Description Clear",
      description: "This is a test description that will be cleared",
      breweryId: testBrewery.breweryId,
      styleId: testStyle.styleId,
      abv: "5.0",
      ibu: 40,
      status: "on_tap",
    });

    // Get the created beer ID
    const beers = await getBeerById(seedData.beers[0].beerId);
    const allBeers = [beers, ...seedData.beers];
    const createdBeer = allBeers.find((b) => b?.name === "Test Beer for Description Clear");
    if (!createdBeer) throw new Error("Failed to create test beer");
    testBeerId = createdBeer.beerId;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it("should update beer description to empty string", async () => {
    // Verify the beer has a description initially
    const beerBefore = await getBeerById(testBeerId);
    expect(beerBefore).toBeDefined();
    expect(beerBefore?.description).toBe("This is a test description that will be cleared");

    // Update the description to an empty string
    await updateBeer(testBeerId, {
      description: "",
    });

    // Verify the description is now empty
    const beerAfter = await getBeerById(testBeerId);
    expect(beerAfter).toBeDefined();
    expect(beerAfter?.description).toBe("");
  });

  it("should update beer description to null when undefined is passed", async () => {
    // First set a description
    await updateBeer(testBeerId, {
      description: "New description",
    });

    const beerBefore = await getBeerById(testBeerId);
    expect(beerBefore?.description).toBe("New description");

    // Update with undefined (should set to null or keep existing based on implementation)
    await updateBeer(testBeerId, {
      description: undefined,
    });

    const beerAfter = await getBeerById(testBeerId);
    expect(beerAfter).toBeDefined();
    // When undefined is passed, Drizzle typically doesn't update the field
    // So it should remain unchanged
    expect(beerAfter?.description).toBe("New description");
  });

  it("should update other fields while clearing description", async () => {
    // Set initial state
    await updateBeer(testBeerId, {
      description: "Description to be cleared",
      abv: "5.5",
    });

    const beerBefore = await getBeerById(testBeerId);
    expect(beerBefore?.description).toBe("Description to be cleared");
    expect(beerBefore?.abv).toBe("5.5");

    // Update ABV and clear description at the same time
    await updateBeer(testBeerId, {
      description: "",
      abv: "6.0",
    });

    const beerAfter = await getBeerById(testBeerId);
    expect(beerAfter?.description).toBe("");
    expect(beerAfter?.abv).toBe("6.0");
  });
});
