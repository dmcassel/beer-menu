import { sql } from "drizzle-orm";
import { getDb } from "./db";

/**
 * Get menu categories that have at least one beer style associated with them
 * and at least one beer in that style with status not "out"
 */
export async function getAvailableMenuCategories() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT DISTINCT mc.menu_cat_id, mc.name, mc.description
    FROM menu_category mc
    INNER JOIN style s ON s.menu_category_id = mc.menu_cat_id
    INNER JOIN beer b ON b.style_id = s.style_id
    WHERE b.status != 'out'
    ORDER BY mc.name
  `);
  
  return result.rows;
}

/**
 * Get beers filtered by menu category (based on beer style's menu category assignment)
 */
export async function getBeersByMenuCategory(menuCatId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.execute(sql`
    SELECT b.*
    FROM beer b
    INNER JOIN style s ON b.style_id = s.style_id
    WHERE s.menu_category_id = ${menuCatId}
    AND b.status != 'out'
    ORDER BY b.name
  `);
  
  return result.rows;
}

/**
 * Get breweries that have at least one available beer,
 * optionally filtered by menu categories and/or beer styles
 */
export async function getAvailableBreweries(
  menuCategoryIds?: number[],
  styleIds?: number[]
) {
  const db = await getDb();
  if (!db) return [];
  
  let query = sql`
    SELECT DISTINCT br.brewery_id, br.name, br.location
    FROM brewery br
    INNER JOIN beer b ON b.brewery_id = br.brewery_id
  `;
  
  // Join with style if we need to filter by menu categories
  if (menuCategoryIds && menuCategoryIds.length > 0) {
    query = sql`${query} INNER JOIN style s ON b.style_id = s.style_id`;
  } else if (styleIds && styleIds.length > 0) {
    // No need to join if we're only filtering by style IDs (already in beer table)
  }
  
  // Start WHERE clause
  query = sql`${query} WHERE b.status != 'out'`;
  
  // Add menu category filter
  if (menuCategoryIds && menuCategoryIds.length > 0) {
    query = sql`${query} AND s.menu_category_id IN (${sql.join(menuCategoryIds.map(id => sql`${id}`), sql`, `)})`;
  }
  
  // Add style filter
  if (styleIds && styleIds.length > 0) {
    query = sql`${query} AND b.style_id IN (${sql.join(styleIds.map(id => sql`${id}`), sql`, `)})`;
  }
  
  query = sql`${query} ORDER BY br.name`;
  
  const result = await db.execute(query);
  return result.rows;
}
