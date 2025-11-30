CREATE TABLE `beer` (
	`beer_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`brewery_id` int,
	`style_id` int,
	`abv` decimal(4,2),
	`ibu` int,
	CONSTRAINT `beer_beer_id` PRIMARY KEY(`beer_id`)
);
--> statement-breakpoint
CREATE TABLE `bjcp_category` (
	`bjcp_id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `bjcp_category_bjcp_id` PRIMARY KEY(`bjcp_id`)
);
--> statement-breakpoint
CREATE TABLE `brewery` (
	`brewery_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(255),
	CONSTRAINT `brewery_brewery_id` PRIMARY KEY(`brewery_id`)
);
--> statement-breakpoint
CREATE TABLE `menu_category` (
	`menu_cat_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	CONSTRAINT `menu_category_menu_cat_id` PRIMARY KEY(`menu_cat_id`)
);
--> statement-breakpoint
CREATE TABLE `menu_category_beer` (
	`menu_cat_id` int NOT NULL,
	`beer_id` int NOT NULL,
	CONSTRAINT `menu_category_beer_menu_cat_id_beer_id_pk` PRIMARY KEY(`menu_cat_id`,`beer_id`)
);
--> statement-breakpoint
CREATE TABLE `style` (
	`style_id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`bjcp_id` int,
	`bjcp_link` varchar(255),
	CONSTRAINT `style_style_id` PRIMARY KEY(`style_id`)
);
--> statement-breakpoint
ALTER TABLE `beer` ADD CONSTRAINT `beer_brewery_id_brewery_brewery_id_fk` FOREIGN KEY (`brewery_id`) REFERENCES `brewery`(`brewery_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `beer` ADD CONSTRAINT `beer_style_id_style_style_id_fk` FOREIGN KEY (`style_id`) REFERENCES `style`(`style_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_category_beer` ADD CONSTRAINT `menu_category_beer_menu_cat_id_menu_category_menu_cat_id_fk` FOREIGN KEY (`menu_cat_id`) REFERENCES `menu_category`(`menu_cat_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_category_beer` ADD CONSTRAINT `menu_category_beer_beer_id_beer_beer_id_fk` FOREIGN KEY (`beer_id`) REFERENCES `beer`(`beer_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `style` ADD CONSTRAINT `style_bjcp_id_bjcp_category_bjcp_id_fk` FOREIGN KEY (`bjcp_id`) REFERENCES `bjcp_category`(`bjcp_id`) ON DELETE set null ON UPDATE no action;