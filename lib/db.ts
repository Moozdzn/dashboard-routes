import { createPool, type Pool, type ConnectionOptions } from "mysql2/promise";

type SshCredentials = {
	host?: string;
	port?: string;
	username?: string;
	password?: string;
};

const CREDENTIALS: {
	db: ConnectionOptions;
	ssh?: SshCredentials;
} = {
	ssh: {
		host: process.env.EN_SSH_HOST,
		port: process.env.EN_SSH_PORT,
		username: process.env.SHARED_USER,
		password: process.env.EN_SSH_PASSWORD,
	},
	db: {
		host: process.env.DATABASE_HOST,
		port: Number(process.env.DATABASE_PORT) || 3306,
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,
	},
};

const createConnection = () => createPool(CREDENTIALS.db);

export const pool: Pool = createConnection();

export const getPoolConnection = () => pool.getConnection();
