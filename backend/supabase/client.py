from dotenv import load_dotenv
from supabase import create_client
import os

# Load the .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Use consistent variable names
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("SUPABASE_URL or SUPABASE_KEY not found in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
