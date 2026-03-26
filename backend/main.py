import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from snowflake.snowpark import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SliceRequest(BaseModel):
    sourceDb: str
    sourceSchema: str
    targetDb: str
    targetSchema: str
    samplePercent: int

def get_snowpark_session():
    connection_parameters = {
        "account": os.getenv("SNOWFLAKE_ACCOUNT"),
        "user": os.getenv("SNOWFLAKE_USER"),
        "password": os.getenv("SNOWFLAKE_PASSWORD"),
        "role": os.getenv("SNOWFLAKE_ROLE"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
        "database": os.getenv("SNOWFLAKE_DATABASE"),
        "schema": os.getenv("SNOWFLAKE_SCHEMA"),
    }
    try:
        return Session.builder.configs(connection_parameters).create()
    except Exception as e:
        print(f"Error connecting to Snowflake: {e}")
        return None

@app.post("/api/slice")
async def run_slice(request: SliceRequest):
    session = get_snowpark_session()
    if not session:
        return {
            "status": "success",
            "message": f"Demo Mode: Slicing started from {request.sourceDb}.{request.sourceSchema}",
            "sample_percent": request.samplePercent,
            "execution_id": "MOCK-12345"
        }
    
    try:
        source_db = request.sourceDb
        source_schema = request.sourceSchema
        target_db = request.targetDb
        target_schema = request.targetSchema
        sample_percent = request.samplePercent

        # Ensure target database and schema exist
        session.sql(f"CREATE DATABASE IF NOT EXISTS {target_db}").collect()
        session.sql(f"CREATE SCHEMA IF NOT EXISTS {target_db}.{target_schema}").collect()

        # Get tables in source schema
        tables_df = session.sql(f"SHOW TABLES IN SCHEMA {source_db}.{source_schema}").collect()
        table_names = [row["name"] for row in tables_df]
        
        results = {}
        for table_name in table_names:
            print(f"Slicing table: {table_name}")
            # Create table structure
            session.sql(f"CREATE OR REPLACE TABLE {target_db}.{target_schema}.{table_name} LIKE {source_db}.{source_schema}.{table_name}").collect()
            
            # Insert sampled data
            # Use sample() method or raw SQL
            session.sql(f"INSERT INTO {target_db}.{target_schema}.{table_name} "
                       f"SELECT * FROM {source_db}.{source_schema}.{table_name} SAMPLE ROW ({sample_percent})").collect()
            
            # Get count
            count = session.table(f"{target_db}.{target_schema}.{table_name}").count()
            results[table_name] = count

        return {
            "status": "success",
            "message": f"Successfully sliced {len(table_names)} tables to {target_db}.{target_schema}",
            "tables_processed": table_names,
            "row_counts": results
        }
    except Exception as e:
        print(f"Slice failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

@app.get("/api/history")
async def get_history():
    session = get_snowpark_session()
    if not session:
        return [{"EXECUTION_ID": "DEMO-1", "STATUS": "SUCCESS", "SOURCE": "PROD", "TARGET": "DEV"}]
    
    try:
        query = "SELECT * FROM SNOWSLICE_DB.BACKEND.SLICE_EXECUTION_LOG ORDER BY EXECUTION_TIME DESC LIMIT 50"
        df = session.sql(query).to_pandas()
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000) # User asked for 3000
