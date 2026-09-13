import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv("DATABASE_URL", "")
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret")


settings = Settings()
