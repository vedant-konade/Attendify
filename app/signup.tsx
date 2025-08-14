import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from 'lib/supabaseClient';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignupPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    } 
    if (!name || !enrollment || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            enrollment,
            role: 'student',
          },
        },
      });

      if (error) throw error;



      Alert.alert(
        'Success', 
        'Please login with your email and password',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(76, 19, 110, 1)', 'rgba(118, 27, 137, 1)']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/mit-university-logo.png')}
              style={styles.logo}
            />
            <Text style={styles.universityName}>MIT-ADT UNIVERSITY</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Create Account</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#rgba(255,255,255,0.7)"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enrollment Number"
                placeholderTextColor="#rgba(255,255,255,0.7)"
                value={enrollment}
                onChangeText={setEnrollment}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Mail ID"
                placeholderTextColor="#rgba(255,255,255,0.7)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#rgba(255,255,255,0.7)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#rgba(255,255,255,0.7)"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.signupButton,
                loading && styles.signupButtonDisabled
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 100, height: 100, resizeMode: 'contain' },
  universityName: { color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  formContainer: { flex: 1, justifyContent: 'center' },
  welcomeText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  inputContainer: { marginBottom: 15 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, padding: 15, color: 'white', fontSize: 16 },
  signupButton: { backgroundColor: '#FF5722', borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 20 },
  signupButtonDisabled: { backgroundColor: '#FF8A3D' },
  signupButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginLink: { alignItems: 'center' },
  loginText: { color: 'white', fontSize: 16 },
});

export default SignupPage;