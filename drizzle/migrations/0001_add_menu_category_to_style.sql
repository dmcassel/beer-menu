-- Add menu_category_id column to style table
ALTER TABLE "style" ADD COLUMN "menu_category_id" integer;

-- Add foreign key constraint
ALTER TABLE "style" ADD CONSTRAINT "style_menu_category_id_menu_category_menu_cat_id_fk" 
  FOREIGN KEY ("menu_category_id") REFERENCES "menu_category"("menu_cat_id") ON DELETE set null;
