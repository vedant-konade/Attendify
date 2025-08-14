from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
import numpy as np
import cv2
from deepface import DeepFace
from backend.supabase.client import supabase

router = APIRouter()

class FacePayload(BaseModel):
    student_id: str
    image: str  # base64 image string

@router.post("/attendance/verify-face")
def mark_attendance(payload: FacePayload):
    try:
        # Decode base64 to image
        img_bytes = base64.b64decode(payload.image)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # DeepFace processing
        emb = DeepFace.represent(img_path=img, model_name="Facenet")[0]['embedding']

        # Fetch stored embedding from Supabase
        student = supabase.from_("students").select("metadata").eq("id", payload.student_id).single().execute()
        stored_emb = eval(student.data['metadata']['face_embedding'])  # convert string -> list

        # Compare embeddings
        dist = np.linalg.norm(np.array(emb) - np.array(stored_emb))
        if dist < 0.6:
            return {"status": "Success", "match": True}
        else:
            return {"status": "Success", "match": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/attendance/enroll-face")
def enroll_face(payload: FacePayload):
    try:
        img_bytes = base64.b64decode(payload.image)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        emb = DeepFace.represent(img_path=img, model_name="Facenet")[0]['embedding']
        supabase.from_("students").update({
            "metadata": {"face_embedding": str(emb)}
        }).eq("id", payload.student_id).execute()
        return {"status": "Face enrolled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
