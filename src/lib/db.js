let pool;

async function getPool() {
  if (pool) return pool;

  if (process.env.POSTGRES_URL) {
    const { Pool } = await import('pg');
    const p = new Pool({ connectionString: process.env.POSTGRES_URL });
    const origQuery = p.query.bind(p);

    p.query = (text, params) => {
      let idx = 0;
      const pgText = text
        .replace(/\?/g, () => `$${++idx}`)
        .replace(/\bCASE WHEN\s+(\w+)\s*=\s*1\s+THEN\s+0\s+ELSE\s+1\s+END\b/gi, 'NOT $1')
        .replace(/(\w+)\s*=\s*1\b(?!\s*THEN)/g, '$1 = TRUE')
        .replace(/(\w+)\s*=\s*0\b(?!\s*THEN)/g, '$1 = FALSE');

      const isInsert = /^\s*INSERT\s/i.test(pgText);
      const hasReturning = /\bRETURNING\b/i.test(pgText);
      const finalText = isInsert && !hasReturning ? pgText + ' RETURNING id' : pgText;

      return origQuery(finalText, params).then(r => {
        if (isInsert && r.rows?.length > 0 && r.rows[0]?.id != null) {
          r.insertId = r.rows[0].id;
        }
        return [r];
      });
    };

    pool = p;
  } else {
    const mysql = await import('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'qrmenu_pro',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10'),
      charset: 'utf8mb4',
      ssl: process.env.DB_SSL === 'true' ? {} : undefined,
    });
  }

  return pool;
}

const db = new Proxy({}, {
  get(_, prop) {
    if (prop === 'query') {
      return async (...args) => {
        const p = await getPool();
        return p.query(...args);
      };
    }
  },
});

export default db;
