
CREATE KEYSPACE current WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '3'}  AND durable_writes = true;

CREATE TABLE current.trx (
    id uuid PRIMARY KEY,
    tuid text,
    action text,
    actor text,
    amt float,
    cuid0 text,
    cuid1 text,
    destination text,
    external_id text,
    note text,
    ref_tuid text,
    source text,
    sym text,
    timestamp bigint
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE INDEX trx_source_idx ON current.trx (source);
CREATE INDEX trx_ref_tuid_idx ON current.trx (ref_tuid);
CREATE INDEX trx_destination_idx ON current.trx (destination);
CREATE INDEX trx_tuid_idx ON current.trx (tuid);
