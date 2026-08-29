import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "case-interviewer-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72
EMERGENT_API_KEY = os.getenv("EMERGENT_API_KEY", "")
EMERGENT_BASE_URL = os.getenv("EMERGENT_BASE_URL", "https://api.emergentagent.com/v1")
DB_NAME = "case_interviewer"
