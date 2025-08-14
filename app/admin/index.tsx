import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from 'context/AuthProvider';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=cccccc&color=ffffff&name=A';

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [semesterSearch, setSemesterSearch] = useState('');
  const [semesters, setSemesters] = useState<number[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [degreeSearch, setDegreeSearch] = useState('');
  const [degrees, setDegrees] = useState<string[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<string | null>(null);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false);
  const [degreeDropdownOpen, setDegreeDropdownOpen] = useState(false);
  const { session, loading } = useAuth();

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

  useEffect(() => {
    const fetchSemesters = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('semester')
        .order('semester', { ascending: true });
      if (!error && data) {
        const uniqueSemesters = Array.from(new Set(data.map((c: any) => c.semester))).filter(Boolean);
        setSemesters(uniqueSemesters);
      }
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, semester')
        .order('name', { ascending: true });

      if (!error && data) setCourses(data);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchDegrees = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('degree');
      if (!error && data) {
        const uniqueDegrees = Array.from(new Set(data.map((c: any) => c.degree))).filter(Boolean);
        setDegrees(uniqueDegrees);
      }
    };
    fetchDegrees();
  }, []);

  const filteredSemesters = courses
    .filter(course => selectedCourse ? course.name === selectedCourse.name : true)
    .map(course => course.semester)
    .filter((v, i, a) => a.indexOf(v) === i && v); // unique & non-falsy

  const filteredCourses = courses.filter(course =>
    selectedDegree ? course.degree === selectedDegree : true
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin DashBoard</Text>
      </View>

      {/* Admin Card */}
      <View style={styles.adminCardWrapper}>
        <View style={styles.adminCard}>
          <Image
            source={{ uri: profile?.avatar_url || DEFAULT_AVATAR }}
            style={styles.avatar}
          />
          <View style={styles.adminInfo}>
            <Text style={styles.adminLabel}>Admin Details</Text>
            <Text style={styles.adminName}>{profile?.name || 'Admin Name'}</Text>
            <Text style={styles.adminId}>College ID: {profile?.enrollment_id || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <Text style={[styles.tab, styles.tabActive]}>Undergraduate</Text>
          <Text style={styles.tab}>Postgraduate</Text>
        </View>

        {/* Dropdowns */}
        <View style={styles.dropdownSection}>
          {/* COURSE DROPDOWN */}
          <Text style={styles.dropdownLabel}>Select Course</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setCourseDropdownOpen(open => !open)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>
              {selectedCourse?.name || 'Choose from the list'}
            </Text>
          </TouchableOpacity>
          {courseDropdownOpen && (
            <View style={styles.dropdownOptions}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search course..."
                value={courseSearch}
                onChangeText={setCourseSearch}
                autoFocus
              />
              <FlatList
                data={filteredCourses.filter(c =>
                  c.name.toLowerCase().includes(courseSearch.toLowerCase())
                )}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCourse(item);
                      setCourseDropdownOpen(false);
                    }}
                  >
                    <Text style={[
                      styles.listItem,
                      selectedCourse?.id === item.id && styles.selectedItem
                    ]}>
                      {item.name} {item.semester ? `(Semester ${item.semester})` : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 180 }}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* SEMESTER DROPDOWN */}
          <Text style={styles.dropdownLabel}>Choose Semester</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setSemesterDropdownOpen(open => !open)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>
              {selectedSemester || 'Choose from the list'}
            </Text>
          </TouchableOpacity>
          {semesterDropdownOpen && (
            <View style={styles.dropdownOptions}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search semester..."
                value={semesterSearch}
                onChangeText={setSemesterSearch}
                autoFocus
                keyboardType="numeric"
              />
              <FlatList
                data={filteredSemesters.filter(s => s.toString().includes(semesterSearch))}
                keyExtractor={item => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedSemester(item);
                      setSemesterDropdownOpen(false);
                    }}
                  >
                    <Text style={[
                      styles.listItem,
                      selectedSemester === item && styles.selectedItem
                    ]}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 180 }}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}

          {/* DEGREE DROPDOWN */}
          <Text style={styles.dropdownLabel}>Select Degree</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDegreeDropdownOpen(open => !open)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>
              {selectedDegree || 'Choose from the list'}
            </Text>
          </TouchableOpacity>
          {degreeDropdownOpen && (
            <View style={styles.dropdownOptions}>
              <TextInput
                style={styles.searchBar}
                placeholder="Search degree..."
                value={degreeSearch}
                onChangeText={setDegreeSearch}
                autoFocus
              />
              <FlatList
                data={degrees.filter(d => d.toLowerCase().includes(degreeSearch.toLowerCase()))}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDegree(item);
                      setDegreeDropdownOpen(false);
                    }}
                  >
                    <Text style={[
                      styles.listItem,
                      selectedDegree === item && styles.selectedItem
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 180 }}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.selectBtn}>
          <Text style={styles.selectBtnText}>Select</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Text style={styles.navItemActive}>Dashboard</Text>
        <Text style={styles.navItem}>Calander</Text>
        <Text style={styles.navItem}>Announcements</Text>
        <Text style={styles.navItem}>Profile</Text>
      </View>
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
  adminCardWrapper: {
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
  adminCard: {
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
  adminInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  adminLabel: { color: '#888', fontSize: 14, marginBottom: 2 },
  adminName: { color: '#222', fontWeight: 'bold', fontSize: 18, marginBottom: 2 },
  adminId: { color: '#888', fontSize: 14 },
  scrollContent: { padding: 24 },
  tabs: { flexDirection: 'row', marginBottom: 16 },
  tab: { fontSize: 16, color: '#888', marginRight: 24, paddingBottom: 4 },
  tabActive: { color: '#ff9800', borderBottomWidth: 2, borderColor: '#ff9800' },
  dropdownSection: { marginBottom: 24 },
  dropdownLabel: { color: '#6d1b7b', fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  dropdown: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    justifyContent: 'center',
  },
  dropdownText: { color: '#888' },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    marginBottom: 8,
    padding: 8,
    zIndex: 10,
  },
  searchBar: {
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  listItem: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 4,
    color: '#6d1b7b',
  },
  selectedItem: {
    backgroundColor: '#ff9800',
    color: '#fff',
  },
  selectBtn: {
    backgroundColor: '#ff9800',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  selectBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  navItem: { color: '#b39ddb', fontSize: 14 },
  navItemActive: { color: '#6d1b7b', fontWeight: 'bold', fontSize: 14 },
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