import postgres from 'postgres';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

/* One connection per function instance. prepare:false keeps it compatible with poolers
   (Neon's -pooler host, PgBouncer); idle_timeout lets frozen instances let go of it. */
export const sql = url ? postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 }) : null;
