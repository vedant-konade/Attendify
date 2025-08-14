from deepface import DeepFace
import tempfile
from fastapi import UploadFile

async def verify_face(student_image: UploadFile, reference_img_url: str) -> bool:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_img:
        content = await student_image.read()
        temp_img.write(content)
        temp_img_path = temp_img.name

    try:
        result = DeepFace.verify(img1_path=temp_img_path, img2_path=reference_img_url, enforce_detection=False)
        return result["verified"]
    except Exception as e:
        print("DeepFace Error:", e)
        return False
