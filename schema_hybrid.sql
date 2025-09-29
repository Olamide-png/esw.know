-- pgvector + hybrid search function (works with 3072-dim + IVFFlat)
-- Assumes tables rag_documents / rag_chunks already exist with:
--   embedding vector(3072)
--   tsv tsvector

-- Ensure unique indexes (needed for upserts)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_documents_doc_id_idx ON rag_documents (doc_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rag_chunks_doc_chunk_idx ON rag_chunks (doc_id, chunk_id);

-- Create IVFFlat index (HNSW won't work with 3072 dims)
DROP INDEX IF EXISTS idx_rag_chunks_embed_hnsw;
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embed_ivf
  ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);

-- Backfill tsv once (safe to run any time)
UPDATE rag_chunks
SET tsv = setweight(to_tsvector('english', coalesce(heading,'')),'A')
       || setweight(to_tsvector('english', coalesce(content,'')),'B')
WHERE tsv IS NULL;

VACUUM ANALYZE rag_chunks;

-- ===== Hybrid search function =====
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
LANGUAGE sql STABLE AS $$
  WITH sem AS (
    SELECT c.id, c.doc_id, c.heading, c.content,
           1 - (c.embedding <=> qvec) AS sem_score
    FROM rag_chunks c
    WHERE scope IS NULL OR c.doc_id ILIKE scope
    ORDER BY c.embedding <=> qvec
    LIMIT 60
  ),
  lex AS (
    SELECT c.id, c.doc_id, c.heading, c.content,
           ts_rank_cd(c.tsv, plainto_tsquery('english', qtext)) AS lex_score
    FROM rag_chunks c
    WHERE (scope IS NULL OR c.doc_id ILIKE scope)
      AND plainto_tsquery('english', qtext) @@ c.tsv
    ORDER BY lex_score DESC
    LIMIT 60
  ),
  unioned AS (
    SELECT id, doc_id, heading, content, sem_score, 0::float AS lex_score FROM sem
    UNION
    SELECT id, doc_id, heading, content, 0::float AS sem_score, lex_score FROM lex
  ),
  fused AS (
    SELECT id, doc_id, heading, content,
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

