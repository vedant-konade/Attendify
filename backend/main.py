# backend/main.py
from fastapi import FastAPI
from backend.routes import attendance
from backend.enrollment import register_face

app = FastAPI()
app.include_router(attendance.router)
app.include_router(register_face.router)