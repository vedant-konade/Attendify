import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabaseClient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, StyleSheet, Text, View } from 'react-native';

export default function RegisterFaceScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkFaceRegistered = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('embeddings')
        .eq('id', user.id)
        .single();

      if (data?.embeddings) {
  setRegistered(true);
}

      setLoading(false);
    };

    checkFaceRegistered();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

const uploadFace = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Alert.alert('Error', 'User not authenticated');
    return;
  }

  try {
    const formData = new FormData();
    console.log('Uploading for user.id:', user.id);
    formData.append('student_id', user.id);

    if (!image) {
      Alert.alert('Error', 'No image selected');
      return;
    }

    formData.append('image', {
      uri: image,
      name: 'face.jpg',
      type: 'image/jpeg',
    } as any);

    const BACKEND_URL = 'http://192.168.145.79:8000';

    const response = await fetch(`${BACKEND_URL}/enrollment/register_face`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('API result:', result);

    if (response.ok) {
      Alert.alert('Success', 'Face registered successfully!');
      setRegistered(true);
      router.replace('/student'); // Navigate to student dashboard
    } else {
      Alert.alert('Error', result.message || 'Failed to register face');
    }
  } catch (err) {
    console.error('Upload error:', err);
    Alert.alert('Error', 'Network or server issue');
  }
};

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  if (registered) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>✅ Face already registered.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Your Face</Text>

      {image && (
        <Image source={{ uri: image }} style={styles.preview} />
      )}

      <Button title="Capture Face" onPress={pickImage} />
      {image && <Button title="Register Face" onPress={uploadFace} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  preview: { width: 200, height: 200, marginVertical: 20, borderRadius: 100 },
  info: { fontSize: 16, color: 'green' },
});
