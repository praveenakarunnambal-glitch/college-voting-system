
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)


class Config:
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "praveena_2202")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "college_voting")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "change-this-to-a-random-secret-key"
    )
