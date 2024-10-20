from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from search import main
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class SearchQuery(BaseModel):
    query: str

@app.get("/")
def root():
    return {"message": "Welcome to the search API"}

@app.post("/search")
async def search(search_query: SearchQuery = Body(...)):
    results = main(search_query.query)
    return {"startTime": int(results[0]), "endTime": int(results[1])}
