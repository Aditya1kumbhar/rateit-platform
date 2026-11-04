-- Enable pg_trgm extension for fuzzy trigram text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram index on Place name for acceleration
CREATE INDEX IF NOT EXISTS idx_place_name_trgm ON "Place" USING gin (name gin_trgm_ops);

