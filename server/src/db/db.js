import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const dbPath = process.env.DB_PATH || "./jobpilot.db";
const schemaPath = path.join(__dirname, "schema.sql");
const db = new DatabaseSync(dbPath);
// Run schema on startup (CREATE TABLE IF NOT EXISTS is safe to re-run)
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);
export default db;
//# sourceMappingURL=db.js.map