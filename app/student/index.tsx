import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .eq('role', 'student')
          .single();
        if (data) {
          setProfile(data);
          if (!data.metadata?.embedding) {
            router.replace('/student/register_face');
            return;
          }
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6d1b7b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>
      <View style={styles.profileRow}>
        <View>
          <Text style={styles.greeting}>Hi!</Text>
          <Text style={styles.name}>{profile?.name || 'Student Name'}</Text>
          <Text style={styles.id}>College ID: {profile?.enrollment_id || 'N/A'}</Text>
          <Text style={styles.id}>Email: {profile?.email}</Text>
        </View>
        <Image
          source={{ uri: profile?.avatar_url || 'https://ui-avatars.com/api/?background=cccccc&color=ffffff&name=S' }}
          style={styles.avatar}
        />
      </View>
      <TouchableOpacity style={styles.actionBtn}>
        <Link href="/student/mark" asChild>
          <Text style={styles.actionBtnText}>Mark Attendance</Text>
        </Link>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#6d1b7b', alignSelf: 'center', marginTop: 16, marginBottom: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greeting: { fontSize: 18, color: '#6d1b7b', fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  id: { fontSize: 14, color: '#888' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee' },
  actionBtn: { backgroundColor: '#ff9800', padding: 16, borderRadius: 8, marginTop: 32, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { backgroundColor: '#fff', borderColor: '#ff9800', borderWidth: 1, padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  logoutBtnText: { color: '#ff9800', fontWeight: 'bold', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
