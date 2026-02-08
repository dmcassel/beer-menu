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

export async function getAvailableWinesWithFilters(filters: {
  locationIds?: number[];
  varietalIds?: number[];
}) {
  const db = await getDb();
  if (!db) return [];
  
  // Build location filter with descendants
  let expandedLocationIds: number[] = [];
  if (filters.locationIds && filters.locationIds.length > 0) {
    for (const locationId of filters.locationIds) {
      const descendants = await getDescendantLocationIds(db, locationId);
      expandedLocationIds.push(...descendants);
    }
    // Remove duplicates
    expandedLocationIds = [...new Set(expandedLocationIds)];
  }
  
  // Build WHERE conditions
  const conditions = [or(gt(wine.refrigerated, 0), gt(wine.cellared, 0))];
  
  if (expandedLocationIds.length > 0) {
    conditions.push(inArray(wine.locationId, expandedLocationIds));
  }
  
  // Get wines with filters
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
    .where(sql`${conditions.map(c => sql`(${c})`).reduce((a, b) => sql`${a} AND ${b}`)}`)
    .orderBy(wine.label);
  
  // Get varietals for each wine and filter by varietal if needed
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
  
  // Filter by varietal if specified
  if (filters.varietalIds && filters.varietalIds.length > 0) {
    return winesWithVarietals.filter(wine => 
      wine.varietals.some(v => filters.varietalIds!.includes(v.varietalId))
    );
  }
  
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

// Helper function to get all descendant location IDs (including the location itself)
async function getDescendantLocationIds(db: any, locationId: number): Promise<number[]> {
  const descendants: number[] = [locationId];
  
  // Get direct children
  const children = await db
    .select()
    .from(location)
    .where(eq(location.parentId, locationId));
  
  // Recursively get descendants of each child
  for (const child of children) {
    const childDescendants = await getDescendantLocationIds(db, child.locationId);
    descendants.push(...childDescendants);
  }
  
  return descendants;
}

// Helper function to build location hierarchy path
async function buildLocationPath(db: any, locationId: number): Promise<string> {
  const locations: string[] = [];
  let currentId: number | null = locationId;
  
  while (currentId !== null) {
    const results = await db
      .select()
      .from(location)
      .where(eq(location.locationId, currentId));
    
    if (results.length === 0) break;
    
    const loc = results[0];
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
