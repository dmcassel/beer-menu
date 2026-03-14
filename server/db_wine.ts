import { eq, sql, or, gt, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  winery,
  wine,
  varietal,
  location,
  wineVarietal,
  InsertWinery,
  InsertWine,
  InsertVarietal,
  InsertLocation,
} from "../drizzle/schema";

// ============================================================================
// Winery CRUD
// ============================================================================

export async function getAllWineries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(winery).orderBy(winery.name);
}

export async function getWineryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(winery).where(eq(winery.wineryId, id));
  return results[0] || null;
}

export async function createWinery(data: InsertWinery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(winery).values(data).returning();
  return result[0];
}

export async function updateWinery(id: number, data: Partial<InsertWinery>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(winery)
    .set(data)
    .where(eq(winery.wineryId, id))
    .returning();
  return result[0];
}

export async function deleteWinery(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(winery).where(eq(winery.wineryId, id));
}

// ============================================================================
// Varietal CRUD
// ============================================================================

export async function getAllVarietals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(varietal).orderBy(varietal.name);
}

export async function getVarietalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(varietal).where(eq(varietal.varietalId, id));
  return results[0] || null;
}

export async function createVarietal(data: InsertVarietal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(varietal).values(data).returning();
  return result[0];
}

export async function updateVarietal(id: number, data: Partial<InsertVarietal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(varietal)
    .set(data)
    .where(eq(varietal.varietalId, id))
    .returning();
  return result[0];
}

export async function deleteVarietal(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(varietal).where(eq(varietal.varietalId, id));
}

// ============================================================================
// Location CRUD
// ============================================================================

export async function getAllLocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(location).orderBy(location.name);
}

export async function getLocationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(location).where(eq(location.locationId, id));
  return results[0] || null;
}

export async function getLocationsByParentId(parentId: number | null) {
  const db = await getDb();
  if (!db) return [];
  
  if (parentId === null) {
    return db
      .select()
      .from(location)
      .where(sql`${location.parentId} IS NULL`)
      .orderBy(location.name);
  }
  
  return db
    .select()
    .from(location)
    .where(eq(location.parentId, parentId))
    .orderBy(location.name);
}

export async function getLocationsByType(type: "country" | "area" | "vineyard") {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(location)
    .where(eq(location.type, type))
    .orderBy(location.name);
}

export async function createLocation(data: InsertLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(location).values(data).returning();
  return result[0];
}

export async function updateLocation(id: number, data: Partial<InsertLocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .update(location)
    .set(data)
    .where(eq(location.locationId, id))
    .returning();
  return result[0];
}

export async function deleteLocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(location).where(eq(location.locationId, id));
}

// ============================================================================
// Wine CRUD
// ============================================================================

export async function getAllWines() {
  const db = await getDb();
  if (!db) return [];
  
  // Get wines with their related data
  const wines = await db
    .select({
      wineId: wine.wineId,
      label: wine.label,
      vintage: wine.vintage,
      refrigerated: wine.refrigerated,
      cellared: wine.cellared,
      description: wine.description,
      wineryId: wine.wineryId,
      locationId: wine.locationId,
      wineryName: winery.name,
      locationName: location.name,
    })
    .from(wine)
    .leftJoin(winery, eq(wine.wineryId, winery.wineryId))
    .leftJoin(location, eq(wine.locationId, location.locationId))
    .orderBy(wine.label);
  
  // Get varietals for each wine
  const winesWithVarietals = await Promise.all(
    wines.map(async (w) => {
      const varietals = await db
        .select({
          varietalId: varietal.varietalId,
          name: varietal.name,
        })
        .from(wineVarietal)
        .innerJoin(varietal, eq(wineVarietal.varietalId, varietal.varietalId))
        .where(eq(wineVarietal.wineId, w.wineId));
      
      return {
        ...w,
        varietals,
      };
    })
  );
  
  return winesWithVarietals;
}

export async function getAvailableWines() {
  const db = await getDb();
  if (!db) return [];
  
  // Get wines with at least one bottle (refrigerated > 0 OR cellared > 0)
  const wines = await db
    .select({
      wineId: wine.wineId,
      label: wine.label,
      vintage: wine.vintage,
      refrigerated: wine.refrigerated,
      cellared: wine.cellared,
      description: wine.description,
      wineryId: wine.wineryId,
      locationId: wine.locationId,
      wineryName: winery.name,
      locationName: location.name,
    })
    .from(wine)
    .leftJoin(winery, eq(wine.wineryId, winery.wineryId))
    .leftJoin(location, eq(wine.locationId, location.locationId))
    .where(or(gt(wine.refrigerated, 0), gt(wine.cellared, 0)))
    .orderBy(wine.label);
  
  // Get varietals for each wine
  const winesWithVarietals = await Promise.all(
    wines.map(async (w) => {
      const varietals = await db
        .select({
          varietalId: varietal.varietalId,
          name: varietal.name,
        })
        .from(wineVarietal)
        .innerJoin(varietal, eq(wineVarietal.varietalId, varietal.varietalId))
        .where(eq(wineVarietal.wineId, w.wineId));
      
      return {
        ...w,
        varietals,
      };
    })
  );
  
  return winesWithVarietals;
}

export async function getWineById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select({
      wineId: wine.wineId,
      label: wine.label,
      vintage: wine.vintage,
      refrigerated: wine.refrigerated,
      cellared: wine.cellared,
      description: wine.description,
      wineryId: wine.wineryId,
      locationId: wine.locationId,
      wineryName: winery.name,
      locationName: location.name,
    })
    .from(wine)
    .leftJoin(winery, eq(wine.wineryId, winery.wineryId))
    .leftJoin(location, eq(wine.locationId, location.locationId))
    .where(eq(wine.wineId, id));
  
  if (!results[0]) return null;
  
  const varietals = await db
    .select({
      varietalId: varietal.varietalId,
      name: varietal.name,
    })
    .from(wineVarietal)
    .innerJoin(varietal, eq(wineVarietal.varietalId, varietal.varietalId))
    .where(eq(wineVarietal.wineId, id));
  
  return {
    ...results[0],
    varietals,
  };
}

export async function createWine(data: InsertWine & { varietalIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { varietalIds, ...wineData } = data;
  
  // Insert wine
  const result = await db.insert(wine).values(wineData).returning();
  const newWine = result[0];
  
  // Insert wine-varietal relationships
  if (varietalIds && varietalIds.length > 0) {
    await db.insert(wineVarietal).values(
      varietalIds.map((varietalId) => ({
        wineId: newWine.wineId,
        varietalId,
      }))
    );
  }
  
  return newWine;
}

export async function updateWine(id: number, data: Partial<InsertWine> & { varietalIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { varietalIds, ...wineData } = data;
  
  // Update wine
  const result = await db
    .update(wine)
    .set(wineData)
    .where(eq(wine.wineId, id))
    .returning();
  
  // Update wine-varietal relationships if provided
  if (varietalIds !== undefined) {
    // Delete existing relationships
    await db.delete(wineVarietal).where(eq(wineVarietal.wineId, id));
    
    // Insert new relationships
    if (varietalIds.length > 0) {
      await db.insert(wineVarietal).values(
        varietalIds.map((varietalId) => ({
          wineId: id,
          varietalId,
        }))
      );
    }
  }
  
  return result[0];
}

export async function deleteWine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete wine-varietal relationships first (cascade should handle this, but being explicit)
  await db.delete(wineVarietal).where(eq(wineVarietal.wineId, id));
  
  // Delete wine
  await db.delete(wine).where(eq(wine.wineId, id));
}

// Helper function to build location hierarchy path
async function buildLocationPath(db: any, locationId: number): Promise<string> {
  const locations: string[] = [];
  let currentId: number | null = locationId;
  
  while (currentId !== null) {
    const results: Array<{ locationId: number; name: string; type: string; parentId: number | null }> = await db
      .select()
      .from(location)
      .where(eq(location.locationId, currentId));
    
    if (results.length === 0) break;
    
    const loc: { locationId: number; name: string; type: string; parentId: number | null } = results[0];
    locations.unshift(loc.name); // Add to beginning of array
    currentId = loc.parentId;
  }
  
  return locations.join(" → ");
}

export async function getAllLocationsWithPaths() {
  const db = await getDb();
  if (!db) return [];
  
  const allLocations = await db.select().from(location).orderBy(location.name);
  
  // Build full path for each location
  const locationsWithPaths = await Promise.all(
    allLocations.map(async (loc) => ({
      ...loc,
      fullPath: await buildLocationPath(db, loc.locationId),
    }))
  );
  
  // Sort by full path for better UX
  return locationsWithPaths.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
}

/**
 * Get locations that have at least one available wine (refrigerated > 0 OR cellared > 0),
 * including their full hierarchical path for display.
 * Also includes ancestor locations so users can filter at any level of specificity.
 */
export async function getAvailableLocations() {
  const db = await getDb();
  if (!db) return [];

  // Find all location IDs directly assigned to available wines
  const result = await db.execute(sql`
    WITH RECURSIVE ancestor_tree AS (
      -- Start with locations directly assigned to available wines
      SELECT DISTINCT l.location_id
      FROM location l
      INNER JOIN wine w ON w.location_id = l.location_id
      WHERE (w.refrigerated > 0 OR w.cellared > 0)

      UNION

      -- Walk up to all ancestors
      SELECT l2.location_id
      FROM location l2
      INNER JOIN ancestor_tree at ON l2.location_id = (
        SELECT parent_id FROM location WHERE location_id = at.location_id
      )
      WHERE l2.location_id IS NOT NULL
    )
    SELECT DISTINCT l.location_id as "locationId", l.name, l.type, l.parent_id as "parentId"
    FROM location l
    INNER JOIN ancestor_tree at ON l.location_id = at.location_id
    ORDER BY l.name
  `);

  const locations = result.rows as Array<{
    locationId: number;
    name: string;
    type: string;
    parentId: number | null;
  }>;

  // Build full path for each location
  const locationsWithPaths = await Promise.all(
    locations.map(async (loc) => ({
      ...loc,
      fullPath: await buildLocationPath(db, loc.locationId),
    }))
  );

  return locationsWithPaths.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
}

/**
 * Get available wines (with stock), optionally filtered by location IDs.
 * When location IDs are provided, uses a recursive CTE to include wines assigned
 * to any descendant of the selected locations, so selecting "France" returns
 * wines from all French regions and vineyards.
 * Filtering is performed entirely at the database level.
 */
export async function getAvailableWinesFiltered(locationIds?: number[]) {
  const db = await getDb();
  if (!db) return [];

  let wines;

  if (locationIds && locationIds.length > 0) {
    // Use a recursive CTE to expand selected location IDs to include all descendants
    const locationIdList = locationIds.join(", ");
    const result = await db.execute(sql`
      WITH RECURSIVE location_tree AS (
        -- Start with the selected location IDs
        SELECT location_id
        FROM location
        WHERE location_id IN (${sql.raw(locationIdList)})

        UNION ALL

        -- Recursively add all children
        SELECT l.location_id
        FROM location l
        INNER JOIN location_tree lt ON l.parent_id = lt.location_id
      )
      SELECT
        w.wine_id       AS "wineId",
        w.label,
        w.vintage,
        w.refrigerated,
        w.cellared,
        w.description,
        w.winery_id     AS "wineryId",
        w.location_id   AS "locationId",
        wr.name         AS "wineryName",
        l.name          AS "locationName"
      FROM wine w
      LEFT JOIN winery wr ON w.winery_id = wr.winery_id
      LEFT JOIN location l  ON w.location_id = l.location_id
      WHERE (w.refrigerated > 0 OR w.cellared > 0)
        AND w.location_id IN (SELECT location_id FROM location_tree)
      ORDER BY w.label
    `);
    wines = result.rows as Array<{
      wineId: number;
      label: string;
      vintage: number | null;
      refrigerated: number;
      cellared: number;
      description: string | null;
      wineryId: number | null;
      locationId: number | null;
      wineryName: string | null;
      locationName: string | null;
    }>;
  } else {
    // No location filter — return all available wines
    const rows = await db
      .select({
        wineId: wine.wineId,
        label: wine.label,
        vintage: wine.vintage,
        refrigerated: wine.refrigerated,
        cellared: wine.cellared,
        description: wine.description,
        wineryId: wine.wineryId,
        locationId: wine.locationId,
        wineryName: winery.name,
        locationName: location.name,
      })
      .from(wine)
      .leftJoin(winery, eq(wine.wineryId, winery.wineryId))
      .leftJoin(location, eq(wine.locationId, location.locationId))
      .where(or(gt(wine.refrigerated, 0), gt(wine.cellared, 0)))
      .orderBy(wine.label);
    wines = rows;
  }

  // Attach varietals for each wine
  const winesWithVarietals = await Promise.all(
    wines.map(async (w) => {
      const varietals = await db
        .select({
          varietalId: varietal.varietalId,
          name: varietal.name,
        })
        .from(wineVarietal)
        .innerJoin(varietal, eq(wineVarietal.varietalId, varietal.varietalId))
        .where(eq(wineVarietal.wineId, w.wineId));
      return { ...w, varietals };
    })
  );

  return winesWithVarietals;
}
