const express = require('express');
const cors = require('cors');
const snowflake = require('snowflake-sdk');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

snowflake.configure({
  insecureConnect: true,
  disableOCSPChecks: true
});

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// In-memory history for demo mode
let demoHistory = [
  { 
    RUN_ID: `DEMO-REV-1`, 
    STATUS: "SUCCESS", 
    SOURCE: "PROD_DB.SALES", 
    TARGET: "DEV_DB.SALES_SLICE",
    EXECUTION_TIME: new Date(Date.now() - 3600000).toISOString(),
    SAMPLE_PERCENT: 20
  },
  { 
    RUN_ID: `DEMO-REV-2`, 
    STATUS: "SUCCESS", 
    SOURCE: "MARKETING_DB.LEADS", 
    TARGET: "SANDBOX_DB.LEADS_V1",
    EXECUTION_TIME: new Date(Date.now() - 7200000).toISOString(),
    SAMPLE_PERCENT: 15
  }
];

// Root route for health check
app.get('/', (req, res) => {
  res.json({
    status: "online",
    service: "SnowSlice Backend API",
    endpoints: ["POST /api/slice", "GET /api/history"]
  });
});

// Snowflake connection configuration
const connectionOptions = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  role: 'ACCOUNTADMIN',
  ocspFailOpen: true
};

const executeQuery = (sqlText, bindVars = []) => {
  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(connectionOptions);
    connection.connect((err, conn) => {
      if (err) return reject(err);
      
      conn.execute({
        sqlText,
        binds: bindVars,
        complete: (err, stmt, rows) => {
          if (err) reject(err);
          else resolve(rows);
          conn.destroy();
        }
      });
    });
  });
};

// POST /api/slice
app.post('/api/slice', async (req, res) => {
  const { sourceDb, sourceSchema, targetDb, targetSchema, samplePercent } = req.body;
  
  try {
    if (!process.env.SNOWFLAKE_ACCOUNT || process.env.SNOWFLAKE_ACCOUNT.includes('your_')) {
      const customers_count = Math.floor(1240 * (samplePercent / 100));
      const orders_count = Math.floor(5820 * (samplePercent / 100));
      const products_count = 0;

      const mockResponse = {
        status: "success",
        message: `Demo Mode: Slicing initiated`,
        sample_percent: samplePercent,
        execution_id: `MOCK-${Date.now()}`,
        DURATION_SECONDS: 12,
        ROWS_SCANNED: (customers_count + orders_count) * 5,
        TOTAL_ROWS: customers_count + orders_count + products_count,
        INTEGRITY_CHECK: "PASSED",
        tables_processed: [
          { name: "CUSTOMERS", status: "SUCCESS", count: customers_count, notes: "Reference integrity maintained" },
          { name: "ORDERS", status: "SUCCESS", count: orders_count, notes: "Foreign keys validated" },
          { name: "PRODUCTS", status: "SKIPPED", count: 0, notes: "Target table already up to date" }
        ],
        ROW_COUNTS: {
          "CUSTOMERS": customers_count,
          "ORDERS": orders_count,
          "PRODUCTS": 0
        }
      };

      demoHistory.unshift({
        RUN_ID: mockResponse.execution_id,
        STATUS: "SUCCESS",
        SOURCE: `${sourceDb}.${sourceSchema}`,
        TARGET: `${targetDb}.${targetSchema}`,
        EXECUTION_TIME: new Date().toISOString(),
        SAMPLE_PERCENT: samplePercent
      });

      return res.json(mockResponse);
    }

    console.log(`Executing SP_EXECUTE_SLICE: ${sourceDb}.${sourceSchema} -> ${targetDb}.${targetSchema} (${samplePercent}%)`);
    const sql = `CALL SNOWSLICE_DB.BACKEND.SP_EXECUTE_SLICE(?, ?, ?, ?, ?)`;
    const rows = await executeQuery(sql, [sourceDb, sourceSchema, targetDb, targetSchema, samplePercent]);
    
    let result = rows[0].SP_EXECUTE_SLICE || rows[0].sp_execute_slice || rows[0][Object.keys(rows[0])[0]];
    if (typeof result === 'string') {
        try { result = JSON.parse(result); } catch(e) {}
    }

    res.json({ status: "success", ...result });
  } catch (error) {
    console.error("Slice failed:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

// GET /api/history
app.get('/api/history', async (req, res) => {
  try {
    if (!process.env.SNOWFLAKE_ACCOUNT || process.env.SNOWFLAKE_ACCOUNT.includes('your_')) {
      return res.json(demoHistory);
    }
    const sql = "SELECT * FROM SNOWSLICE_DB.BACKEND.SLICE_EXECUTION_LOG ORDER BY EXECUTION_TIME DESC LIMIT 50";
    const rows = await executeQuery(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/target-stats
app.get('/api/target-stats', async (req, res) => {
  const { db, schema, percent } = req.query;
  const samplePercent = parseInt(percent) || 100;
  
  if (!db || !schema) {
    return res.status(400).json({ error: "Database and Schema are required" });
  }

  try {
    if (!process.env.SNOWFLAKE_ACCOUNT || process.env.SNOWFLAKE_ACCOUNT.includes('your_')) {
      return res.json([
        { TABLE_NAME: "CUSTOMERS", ROW_COUNT: Math.floor(1240 * (samplePercent / 100)) },
        { TABLE_NAME: "ORDERS", ROW_COUNT: Math.floor(5820 * (samplePercent / 100)) },
        { TABLE_NAME: "PRODUCTS", ROW_COUNT: Math.floor(450 * (samplePercent / 100)) }
      ]);
    }
    const sql = `SELECT TABLE_NAME, ROW_COUNT FROM ${db}.INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`;
    const rows = await executeQuery(sql, [schema.toUpperCase()]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Standard login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'abc123' && password === 'abc123') {
    res.json({ status: 'success', user: { id: 'abc123', name: 'Authorized User' } });
  } else {
    res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }
});

// ADMIN LOGIN
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin@snowslice.io' && password === 'Siddhant@123') {
    res.json({ status: 'success', user: { id: 'admin', name: 'System Administrator' } });
  } else {
    res.status(401).json({ status: 'error', message: 'Invalid Admin credentials' });
  }
});

// ADMIN: POST /api/admin/create-user
app.post('/api/admin/create-user', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ status: "error", message: "Email and Role are required" });
  }

  try {
    if (!process.env.SNOWFLAKE_ACCOUNT || process.env.SNOWFLAKE_ACCOUNT.includes('your_')) {
      return res.json({ status: "success", message: `Demo Mode: User ${email} created and granted role ${role} (Simulated)` });
    }
    // 1. Create User
    const createUserSql = `CREATE USER IF NOT EXISTS "${email}" PASSWORD = 'temporary_password'`;
    await executeQuery(createUserSql);

    // 2. Grant Role (Using uppercase and checking if role is valid for your env)
    // Note: Snowflake usually requires roles like 'SYSADMIN' or 'USERADMIN' instead of just 'ADMIN'
    const roleToGrant = role === 'ADMIN' ? 'SYSADMIN' : 'PUBLIC'; 
    const grantRoleSql = `GRANT ROLE ${roleToGrant} TO USER "${email}"`;
    await executeQuery(grantRoleSql);

    res.json({
      status: "success",
      message: `User ${email} created successfully and assigned role ${roleToGrant}`
    });
  } catch (error) {
    console.error("Admin user creation failed:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(port, () => {
  console.log(`SnowSlice Backend running at http://localhost:${port}`);
});
