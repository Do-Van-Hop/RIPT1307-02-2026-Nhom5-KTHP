import cloudinary
from app.core.config import CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET


def init_cloudinary() -> None:
    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=CLOUD_API_KEY,
        api_secret=CLOUD_API_SECRET
    )
