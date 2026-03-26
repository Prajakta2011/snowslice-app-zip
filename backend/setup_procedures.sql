USE ROLE ACCOUNTADMIN;
CREATE DATABASE IF NOT EXISTS SNOWSLICE_DB;
CREATE SCHEMA IF NOT EXISTS SNOWSLICE_DB.BACKEND;
USE SCHEMA SNOWSLICE_DB.BACKEND;

-- 1. Create Dependency Map Procedure
CREATE OR REPLACE PROCEDURE SP_BUILD_DEPENDENCY_MAP(
    SRC_DB STRING,
    SRC_SCHEMA STRING
)
RETURNS VARIANT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-snowpark-python','networkx','pandas')
HANDLER = 'main'
EXECUTE AS OWNER
AS
$$
import networkx as nx
import pandas as pd
import json

def main(session, src_db, src_schema):

    query = (
        "SELECT FK.TABLE_NAME AS CHILD_TABLE, PK.TABLE_NAME AS PARENT_TABLE "
        "FROM " + src_db + ".INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS RC "
        "JOIN " + src_db + ".INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK "
        "ON RC.CONSTRAINT_NAME = FK.CONSTRAINT_NAME "
        "JOIN " + src_db + ".INFORMATION_SCHEMA.TABLE_CONSTRAINTS PK "
        "ON RC.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME "
        "WHERE FK.CONSTRAINT_SCHEMA = '" + src_schema + "'"
    )

    df_edges = session.sql(query).to_pandas()

    tables_query = (
        "SELECT TABLE_NAME FROM " + src_db +
        ".INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" +
        src_schema + "' AND TABLE_TYPE = 'BASE TABLE'"
    )

    df_nodes = session.sql(tables_query).to_pandas()
    all_tables = df_nodes['TABLE_NAME'].tolist()

    G = nx.DiGraph()
    G.add_nodes_from(all_tables)

    for _, row in df_edges.iterrows():
        if row['PARENT_TABLE'] != row['CHILD_TABLE']:
            G.add_edge(row['PARENT_TABLE'], row['CHILD_TABLE'])

    roots = [n for n, d in G.in_degree() if d == 0]

    try:
        insert_order = list(nx.topological_sort(G))
    except:
        insert_order = all_tables

    return {
        "source_schema": src_db + "." + src_schema,
        "total_tables": len(all_tables),
        "roots": roots,
        "insert_order": insert_order
    }
$$;

-- 2. Create Execution Log Table
CREATE TABLE IF NOT EXISTS SNOWSLICE_DB.BACKEND.SLICE_EXECUTION_LOG (
    RUN_ID STRING,
    EXECUTION_TIME TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    EXECUTED_BY STRING,
    SOURCE STRING,
    TARGET STRING,
    SAMPLE_PERCENT NUMBER,
    TABLES_PROCESSED NUMBER,
    ROW_COUNTS VARIANT,
    STATUS STRING,
    DURATION_SECONDS FLOAT
);

-- 3. Create Execute Slice Procedure
CREATE OR REPLACE PROCEDURE SP_EXECUTE_SLICE(
    SRC_DB STRING,
    SRC_SCHEMA STRING,
    TGT_DB STRING,
    TGT_SCHEMA STRING,
    SAMPLE_PERCENT NUMBER
)
RETURNS VARIANT
LANGUAGE PYTHON
RUNTIME_VERSION = '3.10'
PACKAGES = ('snowflake-snowpark-python','pandas')
HANDLER = 'main'
EXECUTE AS OWNER
AS
$$
import json
import pandas as pd
import uuid
from datetime import datetime

def main(session, src_db, src_schema, tgt_db, tgt_schema, sample_percent):

    run_id = str(uuid.uuid4())
    start_time = datetime.now()
    executed_by = session.sql("SELECT CURRENT_USER()").collect()[0][0]
    status = "SUCCESS"
    
    try:
        # Get dependency map
        dep_raw = session.call(
            "SNOWSLICE_DB.BACKEND.SP_BUILD_DEPENDENCY_MAP",
            src_db,
            src_schema
        )

        dep = json.loads(dep_raw) if isinstance(dep_raw, str) else dep_raw
        insert_order = dep["insert_order"]
        roots = dep["roots"]

        # Create target schema
        session.sql(f"CREATE DATABASE IF NOT EXISTS {tgt_db}").collect()
        session.sql(f"CREATE SCHEMA IF NOT EXISTS {tgt_db}.{tgt_schema}").collect()

        key_map = {}
        execution_log = {}

        # Process tables in topological order
        for table in insert_order:
            source_table = f"{src_db}.{src_schema}.{table}"
            target_table = f"{tgt_db}.{tgt_schema}.{table}"

            # Create table structure
            session.sql(f"CREATE OR REPLACE TABLE {target_table} LIKE {source_table}").collect()

            # Detect Primary Key
            pk_meta = session.sql(f"SHOW PRIMARY KEYS IN TABLE {source_table}").collect()
            pk_column = pk_meta[0]['column_name'] if pk_meta else None

            # ROOT TABLE -> SAMPLE
            if table in roots:
                session.sql(f"""
                    INSERT INTO {target_table}
                    SELECT * FROM {source_table}
                    SAMPLE ({sample_percent})
                """).collect()

            # CHILD TABLE -> FILTER BY FK
            else:
                fk_meta = session.sql(f"SHOW IMPORTED KEYS IN TABLE {source_table}").collect()
                if fk_meta:
                    fk_column = fk_meta[0]['fk_column_name']
                    parent_table = fk_meta[0]['pk_table_name']
                    parent_keys = key_map.get(parent_table, [])

                    if parent_keys:
                        key_list = ",".join([f"'{k}'" if isinstance(k, str) else str(k) for k in parent_keys])
                        session.sql(f"""
                            INSERT INTO {target_table}
                            SELECT * FROM {source_table}
                            WHERE {fk_column} IN ({key_list})
                        """).collect()

            # Capture Keys for downstream tables
            if pk_column:
                df_keys = session.sql(f"SELECT {pk_column} FROM {target_table}").to_pandas()
                key_map[table] = df_keys[pk_column].tolist()

            # Capture Row Count
            count = session.sql(f"SELECT COUNT(*) FROM {target_table}").collect()[0][0]
            execution_log[table] = count

    except Exception as e:
        status = "FAILED"
        execution_log["error"] = str(e)

    duration = (datetime.now() - start_time).total_seconds()

    # Log the execution
    session.sql(f"""
        INSERT INTO SNOWSLICE_DB.BACKEND.SLICE_EXECUTION_LOG 
        (RUN_ID, EXECUTED_BY, SOURCE, TARGET, SAMPLE_PERCENT, TABLES_PROCESSED, ROW_COUNTS, STATUS, DURATION_SECONDS)
        SELECT ?, ?, ?, ?, ?, ?, PARSE_JSON(?), ?, ?
    """, (
        run_id, executed_by, f"{src_db}.{src_schema}", f"{tgt_db}.{tgt_schema}", 
        sample_percent, len(execution_log), json.dumps(execution_log), status, duration
    )).collect()

    return {
        "run_id": run_id,
        "status": status,
        "source": f"{src_db}.{src_schema}",
        "target": f"{tgt_db}.{tgt_schema}",
        "tables_processed": len(execution_log),
        "row_counts": execution_log,
        "duration_seconds": duration
    }
$$;
