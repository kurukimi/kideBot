"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
const dbUrl = process.env.DB_URL;
exports.db = new pg_1.Pool({
    connectionString: dbUrl
});
