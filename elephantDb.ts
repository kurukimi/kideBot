import { Pool } from 'pg'

const dbUrl = process.env.DB_URL
export const db = new Pool({
	connectionString: dbUrl
} )