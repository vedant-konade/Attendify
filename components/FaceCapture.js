import { Camera } from 'expo-camera';
import { useRef, useState } from 'react';
import { View, Button, Image } from 'react-native';

export default function FaceCapture() {
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setPhotoUri(photo.uri);
      sendToBackend(photo.base64);  // Pass to backend
    }
  };

  const sendToBackend = async (base64) => {
    await fetch('http://your-server-ip:8000/attendance/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, student_id: '123' }),
    });
  };

  return (
    <View>
      <Camera ref={cameraRef} style={{ height: 400 }} />
      <Button title="Take Picture" onPress={takePicture} />
      {photoUri && <Image source={{ uri: photoUri }} style={{ width: 200, height: 200 }} />}
    </View>
  );
}
