-- ================================
-- RAG + pgvector drop-in migration
-- ================================

-- 0) Extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- optional but handy for other text ops

-- 1) Uniques / PK helpers (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_documents_doc_id_idx ON rag_documents (doc_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_chunks_doc_chunk_idx ON rag_chunks (doc_id, chunk_id);

-- 2) ANN index for 3072-dim vectors (IVFFlat; HNSW not supported for 3072)
DROP INDEX IF EXISTS idx_rag_chunks_embed_hnsw;
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embed_ivf
  ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 200);

-- 3) Full-text GIN index for lexical search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_tsv_gin
  ON rag_chunks USING gin (tsv);

-- 4) One-time backfill for TSV (safe to run anytime; no-op if already set)
UPDATE rag_chunks AS c
SET tsv =
  setweight(to_tsvector('english', coalesce(c.heading, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(c.content, '')), 'B')
WHERE c.tsv IS NULL;

VACUUM ANALYZE rag_chunks;

-- 5) Trigger function to auto-build TSV on INSERT/UPDATE of heading/content
CREATE OR REPLACE FUNCTION rag_chunks_tsv_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recompute TSV only if heading/content changed (or on insert)
  IF TG_OP = 'INSERT'
     OR NEW.heading IS DISTINCT FROM OLD.heading
     OR NEW.content IS DISTINCT FROM OLD.content
  THEN
    NEW.tsv :=
      setweight(to_tsvector('english', coalesce(NEW.heading, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  END IF;
  RETURN NEW;
END;
$$;

-- 6) Trigger binding
DROP TRIGGER IF EXISTS trg_rag_chunks_tsv_refresh ON rag_chunks;
CREATE TRIGGER trg_rag_chunks_tsv_refresh
BEFORE INSERT OR UPDATE OF heading, content
ON rag_chunks
FOR EACH ROW
EXECUTE FUNCTION rag_chunks_tsv_refresh();

-- 7) Hybrid search (semantic + lexical), fused with 0.7/0.3; scope via ILIKE
CREATE OR REPLACE FUNCTION rag_hybrid_search(
  qvec  vector,
  qtext text,
  k     int,
  scope text DEFAULT NULL
)
RETURNS TABLE (
  id        bigint,
  doc_id    text,
  heading   text,
  content   text,
  sem_score float4,
  lex_score float4,
  score     float4
)
LANGUAGE sql
STABLE
-- Tune at will: higher probes = better recall, more CPU
SET ivfflat.probes = '12'
AS $$
  WITH
  sem AS (
    SELECT c.id, c.doc_id, c.heading, c.content,
           1 - (c.embedding <=> qvec) AS sem_score
    FROM rag_chunks c
    WHERE (scope IS NULL OR c.doc_id ILIKE scope)
    ORDER BY c.embedding <=> qvec
    LIMIT 60
  ),
  lex AS (
    SELECT c.id, c.doc_id, c.heading, c.content,
           ts_rank_cd(c.tsv, websearch_to_tsquery('english', qtext)) AS lex_score
    FROM rag_chunks c
    WHERE (scope IS NULL OR c.doc_id ILIKE scope)
      AND websearch_to_tsquery('english', qtext) @@ c.tsv
    ORDER BY lex_score DESC
    LIMIT 60
  ),
  unioned AS (
    SELECT id, doc_id, heading, content, sem_score, 0::float AS lex_score FROM sem
    UNION
    SELECT id, doc_id, heading, content, 0::float AS sem_score, lex_score FROM lex
  ),
  fused AS (
    SELECT
      id, doc_id, heading, content,
      max(sem_score) AS sem_score,
      max(lex_score) AS lex_score,
      (0.7*max(sem_score) + 0.3*max(lex_score)) AS score
    FROM unioned
    GROUP BY id, doc_id, heading, content
  )
  SELECT id, doc_id, heading, content, sem_score, lex_score, score
  FROM fused
  ORDER BY score DESC
  LIMIT k;
$$;

-- Optional: ensure planner favors the ANN index after large ingests
ANALYZE rag_chunks;


