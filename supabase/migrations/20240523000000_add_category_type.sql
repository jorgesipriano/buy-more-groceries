-- Add 'type' column to categories table
ALTER TABLE categories 
ADD COLUMN type text DEFAULT 'supermarket';

-- Update existing categories to be 'supermarket' (optional, as default handles it)
UPDATE categories SET type = 'supermarket' WHERE type IS NULL;
