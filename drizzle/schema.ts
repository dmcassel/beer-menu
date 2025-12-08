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
