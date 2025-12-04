import { pgTable, serial, varchar, foreignKey, text, integer, numeric, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const bjcpCategory = pgTable("bjcp_category", {
	bjcpId: serial("bjcp_id").primaryKey().notNull(),
	label: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
});

export const style = pgTable("style", {
	styleId: serial("style_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	bjcpId: integer("bjcp_id"),
	bjcpLink: varchar("bjcp_link", { length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.bjcpId],
			foreignColumns: [bjcpCategory.bjcpId],
			name: "style_bjcp_id_fkey"
		}).onDelete("set null"),
]);

export const brewery = pgTable("brewery", {
	breweryId: serial("brewery_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 255 }),
});

export const beer = pgTable("beer", {
	beerId: serial("beer_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	breweryId: integer("brewery_id"),
	styleId: integer("style_id"),
	abv: numeric({ precision: 4, scale:  2 }),
	ibu: integer(),
}, (table) => [
	foreignKey({
			columns: [table.breweryId],
			foreignColumns: [brewery.breweryId],
			name: "beer_brewery_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.styleId],
			foreignColumns: [style.styleId],
			name: "beer_style_id_fkey"
		}).onDelete("set null"),
]);

export const menuCategory = pgTable("menu_category", {
	menuCatId: serial("menu_cat_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
});

export const menuCategoryBeer = pgTable("menu_category_beer", {
	menuCatId: integer("menu_cat_id").notNull(),
	beerId: integer("beer_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.menuCatId],
			foreignColumns: [menuCategory.menuCatId],
			name: "menu_category_beer_menu_cat_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.beerId],
			foreignColumns: [beer.beerId],
			name: "menu_category_beer_beer_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.menuCatId, table.beerId], name: "menu_category_beer_pkey"}),
]);
