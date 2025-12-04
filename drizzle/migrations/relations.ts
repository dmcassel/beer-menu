import { relations } from "drizzle-orm/relations";
import { bjcpCategory, style, brewery, beer, menuCategory, menuCategoryBeer } from "./schema";

export const styleRelations = relations(style, ({one, many}) => ({
	bjcpCategory: one(bjcpCategory, {
		fields: [style.bjcpId],
		references: [bjcpCategory.bjcpId]
	}),
	beers: many(beer),
}));

export const bjcpCategoryRelations = relations(bjcpCategory, ({many}) => ({
	styles: many(style),
}));

export const beerRelations = relations(beer, ({one, many}) => ({
	brewery: one(brewery, {
		fields: [beer.breweryId],
		references: [brewery.breweryId]
	}),
	style: one(style, {
		fields: [beer.styleId],
		references: [style.styleId]
	}),
	menuCategoryBeers: many(menuCategoryBeer),
}));

export const breweryRelations = relations(brewery, ({many}) => ({
	beers: many(beer),
}));

export const menuCategoryBeerRelations = relations(menuCategoryBeer, ({one}) => ({
	menuCategory: one(menuCategory, {
		fields: [menuCategoryBeer.menuCatId],
		references: [menuCategory.menuCatId]
	}),
	beer: one(beer, {
		fields: [menuCategoryBeer.beerId],
		references: [beer.beerId]
	}),
}));

export const menuCategoryRelations = relations(menuCategory, ({many}) => ({
	menuCategoryBeers: many(menuCategoryBeer),
}));