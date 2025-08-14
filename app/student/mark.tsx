import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabaseClient';

export default function MarkAttendanceScreen() {
  const [session, setSession] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('is_active', true)
        .eq('course_id', 'student-course-id') // optional filtering
        .limit(1)
        .single();

      if (error) console.log('Error:', error);
      setSession(data);
      setLoading(false);
    };

    fetchSession();
  }, []);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      aspect: [1, 1],
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleMarkAttendance = async () => {
    if (!session) return Alert.alert("No active class");

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({});
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Alert.alert("User not found");
    }

    const formData = new FormData();
    formData.append('student_id', user.id);
    formData.append('session_id', session.id);
    formData.append('latitude', String(location.coords.latitude));
    formData.append('longitude', String(location.coords.longitude));

    if (!image) {
      return Alert.alert("No image selected");
    }

    // Convert image URI to Blob
    const responseImage = await fetch(image);
    const blob = await responseImage.blob();
    formData.append('image', blob, 'face.jpg');

    const response = await fetch('http://YOUR_FASTAPI_URL/attendance/verify-face', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    Alert.alert(result.message || 'Marked!');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {session ? (
        <>
          <Text style={styles.header}>Active Session</Text>
          <Text>{session.subject_name} by {session.faculty_name}</Text>

          {image && (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          )}

          <Button title="Take Photo" onPress={takePhoto} />
          {image && <Button title="Mark Attendance" onPress={handleMarkAttendance} />}
        </>
      ) : (
        <Text>No active class found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  imagePreview: { width: 150, height: 150, marginVertical: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
