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
