from fastapi import APIRouter, UploadFile, File , Form
from backend.supabase.client import supabase
from deepface import DeepFace
import numpy as np
import cv2
import io

router = APIRouter()

@router.post("/enrollment/register_face")
async def register_face(student_id: str = Form(...), image: UploadFile = File(...)):
    try:
        # Load image
        image_bytes = await image.read()
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # Generate embedding
        embedding_obj = DeepFace.represent(img_path=img, model_name="Facenet")[0]
        embedding = [float(e) for e in embedding_obj["embedding"]]

        print("Received student_id:", student_id)
        response = supabase \
            .from_("profiles") \
            .update({ "embeddings": embedding }) \
            .eq("id", student_id) \
            .execute()
        print("Supabase update response:", response)

        return {"message": "Face registered successfully"}
    
    except Exception as e:
        print("Error in face registration:", str(e))
        return JSONResponse(status_code=500, content={"message": f"Failed to register face: {str(e)}"})
