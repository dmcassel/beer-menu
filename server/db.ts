import { asc, eq, and, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  InsertUser,
  users,
  bjcpCategory,
  style,
  brewery,
  beer,
  menuCategory,
  menuCategoryBeer,
  InsertBJCPCategory,
  InsertStyle,
  InsertBrewery,
  InsertBeer,
  InsertMenuCategory,
  InsertMenuCategoryBeer,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.googleId) {
    throw new Error("User googleId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      googleId: user.googleId,
      email: user.email!,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "picture"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.googleId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
}

// BJCP Category queries
export async function getAllBJCPCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bjcpCategory);
}

export async function getBJCPCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bjcpCategory)
    .where(eq(bjcpCategory.bjcpId, id))
    .limit(1);
  return result[0];
}

export async function createBJCPCategory(data: InsertBJCPCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bjcpCategory).values(data);
  return result;
}

export async function updateBJCPCategory(
  id: number,
  data: Partial<InsertBJCPCategory>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(bjcpCategory).set(data).where(eq(bjcpCategory.bjcpId, id));
}

export async function deleteBJCPCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(bjcpCategory).where(eq(bjcpCategory.bjcpId, id));
}

// Style queries
export async function getAllStyles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(style).orderBy(asc(style.name));
}

export async function getStyleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(style)
    .where(eq(style.styleId, id))
    .limit(1);
  return result[0];
}

export async function createStyle(data: InsertStyle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(style).values(data);
}

export async function updateStyle(id: number, data: Partial<InsertStyle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(style).set(data).where(eq(style.styleId, id));
}

export async function deleteStyle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(style).where(eq(style.styleId, id));
}

// Brewery queries
export async function getAllBreweries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brewery).orderBy(asc(brewery.name));
}

export async function getBreweryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(brewery)
    .where(eq(brewery.breweryId, id))
    .limit(1);
  return result[0];
}

export async function createBrewery(data: InsertBrewery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(brewery).values(data);
}

export async function updateBrewery(id: number, data: Partial<InsertBrewery>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(brewery).set(data).where(eq(brewery.breweryId, id));
}

export async function deleteBrewery(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(brewery).where(eq(brewery.breweryId, id));
}

// Beer queries
export async function getAllBeers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(beer).orderBy(asc(beer.name));
}

export async function getAllAvailableBeers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(beer)
    .where(ne(beer.status, "out"))
    .orderBy(asc(beer.name));
}

export async function getBeerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(beer)
    .where(eq(beer.beerId, id))
    .limit(1);
  return result[0];
}

export async function createBeer(data: InsertBeer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(beer).values(data);
}

export async function updateBeer(id: number, data: Partial<InsertBeer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(beer).set(data).where(eq(beer.beerId, id));
}

export async function deleteBeer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(beer).where(eq(beer.beerId, id));
}

// Menu Category queries
export async function getAllMenuCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuCategory).orderBy(asc(menuCategory.name));
}

export async function getMenuCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(menuCategory)
    .where(eq(menuCategory.menuCatId, id))
    .limit(1);
  return result[0];
}

export async function createMenuCategory(data: InsertMenuCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuCategory).values(data);
}

export async function updateMenuCategory(
  id: number,
  data: Partial<InsertMenuCategory>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(menuCategory)
    .set(data)
    .where(eq(menuCategory.menuCatId, id));
}

export async function deleteMenuCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menuCategory).where(eq(menuCategory.menuCatId, id));
}

// Menu Category Beer queries
export async function getBeersInMenuCategory(menuCatId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuCategoryBeer)
    .where(eq(menuCategoryBeer.menuCatId, menuCatId));
}

export async function addBeerToMenuCategory(data: InsertMenuCategoryBeer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuCategoryBeer).values(data);
}

export async function removeBeerFromMenuCategory(
  menuCatId: number,
  beerId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .delete(menuCategoryBeer)
    .where(
      and(
        eq(menuCategoryBeer.menuCatId, menuCatId),
        eq(menuCategoryBeer.beerId, beerId)
      )
    );
}
