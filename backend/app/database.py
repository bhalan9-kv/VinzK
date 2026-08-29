import motor.motor_asyncio
from .config import MONGO_URI, DB_NAME

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

users_col = db["users"]
sessions_col = db["sessions"]
cases_col = db["cases"]
bookmarks_col = db["bookmarks"]


async def init_db():
    await users_col.create_index("email", unique=True)
    await sessions_col.create_index("user_id")
    await bookmarks_col.create_index([("user_id", 1), ("case_id", 1)], unique=True)
    await cases_col.create_index("type")
