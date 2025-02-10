from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tradeconverter import convert_tlg_to_csv
import tempfile
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://trade-conversion.vercel.app",  # Your frontend URL
        "https://tradeconversion.vercel.app",
        "https://trade-converter-new.vercel.app",
        "https://conversion-backend-eight.vercel.app",   # Your backend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/convert")
async def convert_trade_file(file: UploadFile):
    if not file.filename.endswith('.tlg'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a .tlg file")
    
    try:
        # Create temporary files for input and output
        with tempfile.NamedTemporaryFile(delete=False, suffix='.tlg') as temp_input:
            content = await file.read()
            temp_input.write(content)
            temp_input_path = temp_input.name

        temp_output_path = temp_input_path.replace('.tlg', '.csv')
        
        # Convert the file
        convert_tlg_to_csv(temp_input_path, temp_output_path)
        
        # Read the output CSV
        with open(temp_output_path, 'r') as csv_file:
            csv_content = csv_file.read()
            
        # Clean up temporary files
        os.unlink(temp_input_path)
        os.unlink(temp_output_path)
        
        # Generate output filename based on input filename
        output_filename = file.filename.replace('.tlg', '.csv')
        
        return {
            "success": True,
            "data": csv_content,
            "filename": output_filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
