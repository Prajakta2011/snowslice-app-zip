const snowflake = require('snowflake-sdk');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
snowflake.configure({ insecureConnect: true, disableOCSPChecks: true });

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
  role: 'ACCOUNTADMIN',
  ocspFailOpen: true
});

const sqlFile = fs.readFileSync(path.join(__dirname, 'setup_procedures.sql'), 'utf8');

const commands = [];
let currentCommand = '';
let inProcedure = false;

const lines = sqlFile.split('\n');
for (let line of lines) {
    let trimmed = line.trim();
    if (trimmed.startsWith('--')) continue;
    if (!trimmed) continue;

    if (trimmed.includes('$$')) {
        inProcedure = !inProcedure;
        currentCommand += line + '\n';
        if (!inProcedure && trimmed.endsWith(';')) {
            commands.push(currentCommand);
            currentCommand = '';
        }
    } else if (trimmed.endsWith(';') && !inProcedure) {
        currentCommand += line;
        commands.push(currentCommand);
        currentCommand = '';
    } else {
        currentCommand += line + '\n';
    }
}
if (currentCommand.trim()) commands.push(currentCommand);

async function run() {
    return new Promise((resolve, reject) => {
        connection.connect(async (err, conn) => {
            if (err) {
                console.error('Unable to connect: ' + err.message);
                return reject(err);
            }
            console.log('Successfully connected to Snowflake.');

            for (let i = 0; i < commands.length; i++) {
                const cmd = commands[i].trim();
                if (!cmd) continue;
                console.log(`Executing command ${i + 1}/${commands.length}: ${cmd.substring(0, 50)}...`);
                try {
                    await new Promise((res, rej) => {
                        conn.execute({
                            sqlText: cmd,
                            complete: (err, stmt, rows) => {
                                if (err) {
                                    console.error('Error executing statement: ' + err.message);
                                    rej(err);
                                } else {
                                    res(rows);
                                }
                            }
                        });
                    });
                } catch (e) {
                    console.error(`Command ${i + 1} failed.`);
                }
            }
            conn.destroy();
            resolve();
        });
    });
}

run().then(() => console.log('Setup complete.')).catch(err => console.error(err));
