import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return { data: result.rows, error: null }
  } catch (error: any) {
    console.error('Database error:', error)
    return { data: null, error: error.message }
  } finally {
    client.release()
  }
}

export default pool
