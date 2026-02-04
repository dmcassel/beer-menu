import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  serial,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum for role
export const roleEnum = pgEnum("role", ["user", "curator", "admin"]);

export const beerStatusEnum = pgEnum("beer_status", [
  "on_tap",
  "bottle_can",
  "out",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(), // Postgres auto-increment
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  name: text("name"),
  picture: text("picture"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// BJCP Category
export const bjcpCategory = pgTable("bjcp_category", {
  bjcpId: serial("bjcp_id").primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
});

export type BJCPCategory = typeof bjcpCategory.$inferSelect;
export type InsertBJCPCategory = typeof bjcpCategory.$inferInsert;

// Style
export const style = pgTable("style", {
  styleId: serial("style_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bjcpId: integer("bjcp_id").references(() => bjcpCategory.bjcpId, {
    onDelete: "set null",
  }),
  bjcpLink: varchar("bjcp_link", { length: 255 }),
  menuCategoryId: integer("menu_category_id").references(() => menuCategory.menuCatId, {
    onDelete: "set null",
  }),
});

export type Style = typeof style.$inferSelect;
export type InsertStyle = typeof style.$inferInsert;

// Brewery
export const brewery = pgTable("brewery", {
  breweryId: serial("brewery_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
});

export type Brewery = typeof brewery.$inferSelect;
export type InsertBrewery = typeof brewery.$inferInsert;

// Beer
export const beer = pgTable("beer", {
  beerId: serial("beer_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  breweryId: integer("brewery_id").references(() => brewery.breweryId, {
    onDelete: "cascade",
  }),
  styleId: integer("style_id").references(() => style.styleId, {
    onDelete: "set null",
  }),
  abv: numeric("abv", { precision: 4, scale: 2 }),
  ibu: integer("ibu"),
  status: beerStatusEnum("status").notNull().default("out"),
});

export type Beer = typeof beer.$inferSelect;
export type InsertBeer = typeof beer.$inferInsert;

// Menu Category
export const menuCategory = pgTable("menu_category", {
  menuCatId: serial("menu_cat_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
});

export type MenuCategory = typeof menuCategory.$inferSelect;
export type InsertMenuCategory = typeof menuCategory.$inferInsert;

// Menu Category Beer (junction table)
export const menuCategoryBeer = pgTable(
  "menu_category_beer",
  {
    menuCatId: integer("menu_cat_id")
      .notNull()
      .references(() => menuCategory.menuCatId, { onDelete: "cascade" }),
    beerId: integer("beer_id")
      .notNull()
      .references(() => beer.beerId, { onDelete: "cascade" }),
  },
  table => ({
    pk: primaryKey({ columns: [table.menuCatId, table.beerId] }),
  })
);

export type MenuCategoryBeer = typeof menuCategoryBeer.$inferSelect;
export type InsertMenuCategoryBeer = typeof menuCategoryBeer.$inferInsert;

// Relations remain the same
export const bjcpCategoryRelations = relations(bjcpCategory, ({ many }) => ({
  styles: many(style),
}));

export const styleRelations = relations(style, ({ one, many }) => ({
  bjcpCategory: one(bjcpCategory, {
    fields: [style.bjcpId],
    references: [bjcpCategory.bjcpId],
  }),
  menuCategory: one(menuCategory, {
    fields: [style.menuCategoryId],
    references: [menuCategory.menuCatId],
  }),
  beers: many(beer),
}));

export const breweryRelations = relations(brewery, ({ many }) => ({
  beers: many(beer),
}));

export const beerRelations = relations(beer, ({ one, many }) => ({
  brewery: one(brewery, {
    fields: [beer.breweryId],
    references: [brewery.breweryId],
  }),
  style: one(style, {
    fields: [beer.styleId],
    references: [style.styleId],
  }),
  menuCategories: many(menuCategoryBeer),
}));

export const menuCategoryRelations = relations(menuCategory, ({ many }) => ({
  beers: many(menuCategoryBeer),
  styles: many(style),
}));

export const menuCategoryBeerRelations = relations(
  menuCategoryBeer,
  ({ one }) => ({
    menuCategory: one(menuCategory, {
      fields: [menuCategoryBeer.menuCatId],
      references: [menuCategory.menuCatId],
    }),
    beer: one(beer, {
      fields: [menuCategoryBeer.beerId],
      references: [beer.beerId],
    }),
  })
);

// ============================================================================
// Wine-related tables
// ============================================================================

// Location Type Enum
export const locationTypeEnum = pgEnum("location_type", [
  "country",
  "area",
  "vineyard",
]);

// Location Table (Hierarchical)
export const location = pgTable("location", {
  locationId: serial("location_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: locationTypeEnum("type").notNull(),
  parentId: integer("parent_id").references((): any => location.locationId, {
    onDelete: "set null",
  }),
});

export type Location = typeof location.$inferSelect;
export type InsertLocation = typeof location.$inferInsert;

// Winery
export const winery = pgTable("winery", {
  wineryId: serial("winery_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
});

export type Winery = typeof winery.$inferSelect;
export type InsertWinery = typeof winery.$inferInsert;

// Varietal
export const varietal = pgTable("varietal", {
  varietalId: serial("varietal_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
});

export type Varietal = typeof varietal.$inferSelect;
export type InsertVarietal = typeof varietal.$inferInsert;

// Wine
export const wine = pgTable("wine", {
  wineId: serial("wine_id").primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  wineryId: integer("winery_id").references(() => winery.wineryId, {
    onDelete: "cascade",
  }),
  vintage: integer("vintage"),
  locationId: integer("location_id").references(() => location.locationId, {
    onDelete: "set null",
  }),
  refrigerated: integer("refrigerated").notNull().default(0),
  cellared: integer("cellared").notNull().default(0),
  description: text("description"),
});

export type Wine = typeof wine.$inferSelect;
export type InsertWine = typeof wine.$inferInsert;

// Wine-Varietal Junction Table
export const wineVarietal = pgTable(
  "wine_varietal",
  {
    wineId: integer("wine_id")
      .notNull()
      .references(() => wine.wineId, { onDelete: "cascade" }),
    varietalId: integer("varietal_id")
      .notNull()
      .references(() => varietal.varietalId, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.wineId, table.varietalId] }),
  })
);

export type WineVarietal = typeof wineVarietal.$inferSelect;
export type InsertWineVarietal = typeof wineVarietal.$inferInsert;

// ============================================================================
// Wine-related relations
// ============================================================================

export const locationRelations = relations(location, ({ one, many }) => ({
  parent: one(location, {
    fields: [location.parentId],
    references: [location.locationId],
    relationName: "parent_location",
  }),
  children: many(location, { relationName: "parent_location" }),
  wines: many(wine),
}));

export const wineryRelations = relations(winery, ({ many }) => ({
  wines: many(wine),
}));

export const varietalRelations = relations(varietal, ({ many }) => ({
  wines: many(wineVarietal),
}));

export const wineRelations = relations(wine, ({ one, many }) => ({
  winery: one(winery, {
    fields: [wine.wineryId],
    references: [winery.wineryId],
  }),
  location: one(location, {
    fields: [wine.locationId],
    references: [location.locationId],
  }),
  varietals: many(wineVarietal),
}));

export const wineVarietalRelations = relations(wineVarietal, ({ one }) => ({
  wine: one(wine, {
    fields: [wineVarietal.wineId],
    references: [wine.wineId],
  }),
  varietal: one(varietal, {
    fields: [wineVarietal.varietalId],
    references: [varietal.varietalId],
  }),
}));
