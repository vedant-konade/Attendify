import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FacultyAttendance() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFacultySubjectDetails = async () => {
      setLoading(true);

      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError.message);
        setLoading(false);
        return;
      }

      const facultyId = userData.user?.id;
      if (!facultyId) {
        console.error("No faculty ID found for the logged-in user.");
        setLoading(false);
        return;
      }

      // Query your view directly
      const { data, error } = await supabase
        .from('faculty_subject_details')
        .select('*')
        .eq('faculty_id', facultyId);

      if (error) {
        console.error('Error fetching faculty subject details:', error);
      } else {
        console.log('Faculty subject details:', data);
        setSubjects(data || []);
      }

      setLoading(false);
    };

    fetchFacultySubjectDetails();
  }, []);

  const handleStartSession = () => {
    if (!selectedSubjectId) return;
    router.push({
      pathname: '/faculty/create-session-screen',
      params: { subjectId: selectedSubjectId }
    });
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Class for Attendance</Text>
      <FlatList
        data={subjects}
        keyExtractor={(item) => item.subject_class_id}
        renderItem={({ item }) => {
          const isSelected = selectedSubjectId === item.subject_class_id;
          return (
            <TouchableOpacity
              style={[styles.classCard, isSelected && styles.classCardSelected]}
              onPress={() => setSelectedSubjectId(item.subject_class_id)}
            >
              <Text style={styles.className}>
                {item.subject_name ?? 'No Subject'}
              </Text>
              <Text style={styles.classTime}>
                {item.class_name ?? 'No Class'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Button
        title="Start Attendance"
        onPress={handleStartSession}
        disabled={!selectedSubjectId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  classCard: {
    backgroundColor: '#f3e5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  classCardSelected: {
    borderColor: '#6d1b7b',
    borderWidth: 2,
  },
  className: { fontSize: 16, fontWeight: 'bold', color: '#6d1b7b' },
  classTime: { fontSize: 14, color: '#888' },
});
