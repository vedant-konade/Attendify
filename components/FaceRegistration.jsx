import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const FaceRegistration = ({ userId, onImagesCaptured }) => {
  const videoRef = useRef(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [embedding, setEmbedding] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 300,
          height: 300,
          facingMode: "user"
        } 
      });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Failed to access camera');
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
      const file = new File([blob], `face_${images.length + 1}.jpg`, { 
        type: 'image/jpeg' 
      });
      const updatedImages = [...images, file];
      setImages(updatedImages);
      onImagesCaptured?.(updatedImages); // Optional callback
    }, 'image/jpeg', 0.8);
  };

  const uploadImages = async () => {
    if (images.length < 3) {
      alert('Please capture at least 3 images!');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    images.forEach(file => formData.append('files', file));
    formData.append('user_id', userId);

    try {
      const response = await axios.post('http://127.0.0.1:8000/register_face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEmbedding(response.data.embedding);
      alert('✅ Face registered successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      alert('❌ Face registration failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="face-registration">
      <h2>Face Registration</h2>
      <div className="camera-container">
        <video 
          ref={videoRef} 
          width="300" 
          height="300" 
          autoPlay 
          playsInline
        />
      </div>
      
      <div className="controls">
        <button 
          onClick={startCamera} 
          disabled={cameraActive}
        >
          Start Camera
        </button>
        
        <button 
          onClick={captureImage} 
          disabled={!cameraActive || images.length >= 5}
        >
          Capture Image ({images.length}/5)
        </button>
        
        <button 
          onClick={uploadImages} 
          disabled={uploading || images.length < 3}
        >
          {uploading ? 'Uploading...' : 'Register Face'}
        </button>
      </div>

      {embedding && (
        <div className="result">
          <h4>Face Embedding:</h4>
          <code>{JSON.stringify(embedding.slice(0, 5))}...</code>
        </div>
      )}
    </div>
  );
};

export default FaceRegistration;