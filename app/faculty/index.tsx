import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useAuth } from 'context/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=cccccc&color=ffffff&name=F';

export default function FacultyDashboard() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
useEffect(() => {
  if (!loading && !session) {
    console.log(" No session found. Redirecting...");
    router.replace('/login');
    return;
  }

  if (loading || !session) return;

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    console.log(" PROFILE DATA:", data);
    console.log(" PROFILE ERROR:", error);

    if (error) {
      console.error(" Error fetching profile:", error.message);
    }

    setProfile(data);
  };

  fetchProfile();
}, [session, loading]);


  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: 'short' });
  const dateStr = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>DashBoard</Text>
      </View>

      <View style={styles.facultyCardWrapper}>
        <View style={styles.facultyCard}>
          <Image
            source={{ uri: profile?.avatar_url || DEFAULT_AVATAR }}
            style={styles.avatar}
          />
          <View style={styles.facultyInfo}>
            <Text style={styles.facultyLabel}>Faculty Details</Text>
            {loading ? (
              <ActivityIndicator color="#6d1b7b" />
            ) : (
              <>
                <Text style={styles.facultyName}>{profile?.name || 'Faculty Name'}</Text>
                <Text style={styles.facultyId}>
                  College ID: {profile?.enrollment_id || 'N/A'}
                </Text>
                <Text style={styles.facultyEmail}>
                  Email: {profile?.email || 'N/A'}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.timelineLabel}>Today&apos;s Timeline</Text>
        <Text style={styles.timelineDate}>{`${dayName}, ${dateStr}`}</Text>

        <View style={styles.sessionAttendance}>
          <Text style={styles.sessionLabel}>Session Attendance</Text>
          <TouchableOpacity
            style={styles.generateBtn}
            onPress={() => router.push('/faculty/attendance')}
          >
            <Text style={styles.generateBtnText}>Generate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#6d1b7b',
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  facultyCardWrapper: {
    marginHorizontal: 24,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  facultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 18,
    backgroundColor: '#ccc',
  },
  facultyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  facultyLabel: { color: '#888', fontSize: 14, marginBottom: 2 },
  facultyName: { color: '#222', fontWeight: 'bold', fontSize: 18, marginBottom: 2 },
  facultyId: { color: '#888', fontSize: 14, marginBottom: 2 },
  facultyEmail: { color: '#888', fontSize: 14 },
  scrollContent: { padding: 24 },
  timelineLabel: { color: '#888', fontSize: 14, marginTop: 16 },
  timelineDate: { color: '#222', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  sessionAttendance: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sessionLabel: { color: '#6d1b7b', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  generateBtn: { backgroundColor: '#ff9800', borderRadius: 24, paddingHorizontal: 32, paddingVertical: 10 },
  generateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: {
    backgroundColor: '#fff',
    borderColor: '#ff9800',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ff9800',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
