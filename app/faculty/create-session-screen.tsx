// CreateSessionScreen.tsx
import { supabase } from "@/lib/supabaseClient"; // adjust import path to your project
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { JSX, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

async function getFacultyLocation() {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied');
  }

  let location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Highest
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  };
}
// ----- Types -----
type FacultySubjectRow = {
  subject_class_id: string;
  subject_id: string;
  subject_name: string | null;
  class_id: string | null;
  class_name: string | null;
  class_semester: number | null;
};

type StudentRow = {
  id: string;
  name?: string;
  expo_push_token?: string | null;
};

// ----- Constants -----
const SESSION_DURATION_SECONDS = 3 * 60; // 3 minutes
const ATTENDANCE_POLL_INTERVAL_MS = 5000; // 5 seconds
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

export default function CreateSessionScreen(): JSX.Element {
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<FacultySubjectRow[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<FacultySubjectRow | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(true);
  const [startingSession, setStartingSession] = useState<boolean>(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(SESSION_DURATION_SECONDS);
  const [attendanceCount, setAttendanceCount] = useState<number>(0);

const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // ----- Fetch faculty and subjects -----
  useEffect(() => {
    (async () => {
      setLoadingSubjects(true);
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user) {
          throw new Error(userErr?.message ?? "Not logged in");
        }
        const id = userData.user.id;
        setFacultyId(id);

        const { data, error } = await supabase
          .from("faculty_subject_details")
          .select("*")
          .eq("faculty_id", id);

        if (error) throw error;
        setSubjects(data ?? []);
      } catch (err: any) {
        Alert.alert("Error", err.message ?? "Unable to fetch subjects or user.");
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    })();

    // cleanup on unmount
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollerRef.current) clearInterval(pollerRef.current);
    };
  }, []);

  // ----- Helper: fetch enrolled students for a subject_class_id -----
  // Adjust `student_subjects` table name if you use a different name
  async function fetchEnrolledStudents(subjectClassId: string): Promise<StudentRow[]> {
    // We assume a student_subjects table mapping student <-> subject_class
    // and students table having expo_push_token
    try {
      const { data, error } = await supabase
        .from("student_subjects") // change this to your actual enrollment table
        .select(`
          student:student_id (
            id,
            name,
            expo_push_token
          )
        `)
        .eq("subject_class_id", subjectClassId);

      if (error) throw error;

      // data is array of { student: { id, name, expo_push_token } }
      const students: StudentRow[] = (data ?? [])
        .map((r: any) => r.student)
        .filter(Boolean);
      return students;
    } catch (err) {
      console.warn("fetchEnrolledStudents error:", err);
      return [];
    }
  }

  // ----- Helper: send Expo push notifications (simple retry logic) -----
  // Input tokens must be valid Expo push tokens.
  async function sendPushNotifications(tokens: string[], title: string, body: string) {
    if (tokens.length === 0) return;

    // Chunk tokens by 100 per request (Expo recommends not sending huge batches in one go)
    const chunkSize = 100;
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += chunkSize) {
      chunks.push(tokens.slice(i, i + chunkSize));
    }

    const results: any[] = [];
    for (const chunk of chunks) {
      const messages = chunk.map((token) => ({
        to: token,
        title,
        body,
        priority: "high",
        sound: "default",
      }));

      try {
        const resp = await fetch(EXPO_PUSH_ENDPOINT, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        });
        const json = await resp.json();
        results.push(json);
      } catch (err) {
        console.warn("Expo push send error:", err);
      }
    }

    return results;
  }

  // ----- Create session flow -----
  async function handleCreateSession() {
    if (!selectedSubject) return Alert.alert("Please select a subject first.");
    if (!facultyId) return Alert.alert("Faculty not loaded.");

    setStartingSession(true);

    try {
      // 1) Prevent duplicate active sessions
      const { data: activeSessions, error: activeErr } = await supabase
        .from("attendance_sessions")
        .select("id")
        .eq("faculty_id", facultyId)
        .eq("is_active", true);

      if (activeErr) throw activeErr;
      if (activeSessions && activeSessions.length > 0) {
        setStartingSession(false);
        return Alert.alert("You already have an active session.");
      }

      // 2) Get location (with timeout)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission required.");
      }

      let coords;
      try {
        const pos = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Highest,
});

        coords = pos.coords;
      } catch (err) {
        throw new Error("Unable to get location. Try again.");
      }

      const { latitude, longitude } = coords;

      // 3) Insert attendance session - match your DB column names
      // Your table uses `subject_classes` as FK to subject_classes.id (per schema)
      const insertPayload = {
        faculty_id: facultyId,
        subject_class_id: selectedSubject.subject_class_id,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString(),
        location: `SRID=4326;POINT(${longitude} ${latitude})`,
        is_active: true,
        radius_meters: 10,
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("attendance_sessions")
        .insert([{
          subject_class_id: selectedSubject.subject_class_id,
          faculty_id: facultyId,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 minutes later
          is_active: true
        }])
        .select("*")
        .single();

      if (insertErr) throw insertErr;
      if (!inserted?.id) throw new Error("Failed to create session.");

      const newSessionId = inserted.id as string;
      setSessionId(newSessionId);

      // 4) Fetch enrolled students and their Expo tokens
      const enrolled = await fetchEnrolledStudents(selectedSubject.subject_class_id);
      const tokens = enrolled
        .map((s) => s.expo_push_token)
        .filter((t): t is string => typeof t === "string" && t.startsWith("ExponentPushToken"));

      // 5) Send push notifications (async, don't block UI too long)
      const notifTitle = `Attendance open: ${selectedSubject.subject_name ?? "Subject"}`;
      const notifBody = `Mark attendance for ${selectedSubject.class_name ?? ""}. Session will end in 3 minutes.`;

      // Fire & forget but capture result for logs
      const sendResults = await sendPushNotifications(tokens, notifTitle, notifBody);

      // 6) Optionally log notifications to DB if you have a logging table
      // Replace table name/columns if different or remove block if you don't want logs
      try {
        if (tokens.length > 0) {
          await supabase.from("notification_logs").insert({
            session_id: newSessionId,
            faculty_id: facultyId,
            subject_class_id: selectedSubject.subject_class_id,
            token_count: tokens.length,
            payload_title: notifTitle,
            payload_body: notifBody,
            sent_at: new Date().toISOString(),
          });
        }
      } catch (logErr) {
        // not fatal
        console.warn("notification_logs insert failed:", logErr);
      }

      // 7) Start countdown and polling
      startSessionCountdown(newSessionId);

      Alert.alert("Session started", "Students have been notified. Attendance open for 3 minutes.");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to start session.");
      console.warn("handleCreateSession error:", err);
      setStartingSession(false);
    } finally {
      // leave countdown/poller to manage session end; only turn off starting flag if we failed before session start
      if (!sessionId) setStartingSession(false);
    }
  }

  // ----- Poll attendance count & countdown -----
  function startSessionCountdown(newSessionId: string) {
    setCountdown(SESSION_DURATION_SECONDS);
    setAttendanceCount(0);

    // Poll attendance immediately and then periodically
    fetchAttendanceCount(newSessionId);
    pollerRef.current = setInterval(() => fetchAttendanceCount(newSessionId), ATTENDANCE_POLL_INTERVAL_MS);

    // Countdown
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // end session
          if (countdownRef.current) clearInterval(countdownRef.current);
          if (pollerRef.current) clearInterval(pollerRef.current);
          endSession(newSessionId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // One-time timer to end session after SESSION_DURATION_SECONDS
    let timer: ReturnType<typeof setTimeout>;
    timer = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollerRef.current) clearInterval(pollerRef.current);
      endSession(newSessionId);
    }, SESSION_DURATION_SECONDS * 1000);

    setStartingSession(false);
  }

  async function fetchAttendanceCount(activeSessionId: string) {
    try {
      const { count, error } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("session_id", activeSessionId);

      if (error) {
        console.warn("fetchAttendanceCount error:", error);
        return;
      }
      setAttendanceCount(count ?? 0);
    } catch (err) {
      console.warn("fetchAttendanceCount exception:", err);
    }
  }

  async function endSession(activeSessionId: string) {
    try {
      await supabase.from("attendance_sessions").update({ is_active: false }).eq("id", activeSessionId);
    } catch (err) {
      console.warn("endSession error:", err);
    } finally {
      Alert.alert("Session ended", "Attendance window closed.");
      // Reset UI
      setSessionId(null);
      setSelectedSubject(null);
      // Navigate back to dashboard or refresh
      router.replace("/faculty");
    }
  }

  // ----- UI -----
  if (loadingSubjects) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading subjects…</Text>
      </View>
    );
  }

  // If session is active (we have sessionId) show countdown / live view
  if (sessionId) {
    return (
      <View style={styles.center}>
        <Text style={styles.timer}>⏳ {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</Text>
        <Text style={styles.attendanceText}>✅ Students marked: {attendanceCount}</Text>
        <TouchableOpacity style={styles.endButton} onPress={() => endSession(sessionId)}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>End Session Early</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Default: subject selection + start button
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>Start Attendance</Text>

      {subjects.length === 0 ? (
        <Text>No subjects assigned to you.</Text>
      ) : (
        subjects.map((s) => {
          const isSelected = selectedSubject?.subject_class_id === s.subject_class_id;
          return (
            <TouchableOpacity
              key={s.subject_class_id}
              style={[styles.subjectCard, isSelected && styles.selectedSubjectCard]}
              onPress={() => setSelectedSubject(s)}
            >
              <Text style={styles.subjectTitle}>{s.subject_name}</Text>
              <Text style={styles.subjectMeta}>{s.class_name ?? ""} • Sem {s.class_semester ?? "-"}</Text>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity
        style={[styles.startButton, (!selectedSubject || startingSession) && styles.disabledButton]}
        onPress={handleCreateSession}
        disabled={!selectedSubject || startingSession}
      >
        {startingSession ? <ActivityIndicator color="#fff" /> : <Text style={styles.startButtonText}>📍 Start Attendance Session</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  header: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  subjectCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectedSubjectCard: {
    borderColor: "#2f6fd6",
    backgroundColor: "#e9f0ff",
  },
  subjectTitle: { fontSize: 16, fontWeight: "600" },
  subjectMeta: { fontSize: 13, color: "#666", marginTop: 6 },
  startButton: {
    marginTop: 16,
    backgroundColor: "#2f6fd6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: { backgroundColor: "#9fb3e6" },
  startButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  timer: { fontSize: 40, fontWeight: "700", marginBottom: 8 },
  attendanceText: { fontSize: 18, marginBottom: 12 },
  endButton: { marginTop: 12, backgroundColor: "#d9534f", padding: 10, borderRadius: 8 },
});
