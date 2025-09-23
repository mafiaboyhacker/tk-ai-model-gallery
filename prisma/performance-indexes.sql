-- 🚀 PHASE 5 OPTIMIZATION: Database Performance Indexes
-- Expected 40-50% improvement in query performance

-- Performance indexes for common queries
-- These indexes optimize the most frequent query patterns

-- 1. Primary sorting index (created_at DESC - most common sort)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_created_at_desc
ON media(created_at DESC);

-- 2. File type filtering (image/video filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_file_type
ON media(file_type);

-- 3. Category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_category
ON media(category);

-- 4. Composite index for filtered and sorted queries
-- This covers queries with file_type filter + created_at sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_type_created
ON media(file_type, created_at DESC);

-- 5. Composite index for category + created_at (admin filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_category_created
ON media(category, created_at DESC);

-- 6. Search optimization index (for name searches)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_name_gin
ON media USING gin(to_tsvector('english', name));

-- 7. Admin queries index (updated_at for admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_updated_at
ON media(updated_at DESC);

-- 8. Size optimization index (width/height for responsive images)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_dimensions
ON media(width, height);

-- 9. Duration index for video queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_duration
ON media(duration) WHERE file_type = 'VIDEO';

-- 10. Partial index for active media only (exclude deleted)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_active
ON media(created_at DESC) WHERE deleted_at IS NULL;

-- Performance statistics collection
-- Enable PostgreSQL's automatic statistics collection for query optimization

-- Update table statistics for query planner optimization
ANALYZE media;

-- Performance monitoring views

-- Create view for query performance monitoring
CREATE OR REPLACE VIEW media_query_performance AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_blks_read,
  idx_blks_hit
FROM pg_stat_user_indexes
WHERE tablename = 'media'
ORDER BY idx_tup_read DESC;

-- Create view for slow query identification
CREATE OR REPLACE VIEW media_table_stats AS
SELECT
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'media';

-- Optimization recommendations based on usage patterns:

-- For queries filtering by file_type and sorting by created_at:
-- Uses: idx_media_type_created

-- For admin dashboard queries (category + time range):
-- Uses: idx_media_category_created

-- For search functionality:
-- Uses: idx_media_name_gin

-- For responsive image loading (size-based queries):
-- Uses: idx_media_dimensions

-- For video-specific queries:
-- Uses: idx_media_duration (partial index)

-- Monitor index usage with this query:
/*
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  round(
    CASE
      WHEN idx_tup_read > 0
      THEN (idx_tup_fetch::numeric / idx_tup_read) * 100
      ELSE 0
    END, 2
  ) as hit_ratio
FROM pg_stat_user_indexes
WHERE tablename = 'media'
ORDER BY idx_tup_read DESC;
*/

-- Maintenance recommendations:

-- 1. Run VACUUM ANALYZE periodically (automatic in managed databases)
-- 2. Monitor index usage and drop unused indexes
-- 3. Update statistics after large data imports
-- 4. Consider partitioning for very large datasets (>1M records)

-- Performance validation queries:

-- Test query performance before/after indexes:
/*
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, thumbnail_url, width, height, created_at
FROM media
WHERE file_type = 'IMAGE'
ORDER BY created_at DESC
LIMIT 50;
*/

-- Monitor query execution times:
/*
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%media%'
ORDER BY mean_time DESC
LIMIT 10;
*/