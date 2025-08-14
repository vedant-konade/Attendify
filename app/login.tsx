import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) throw error ?? new Error('Login failed');

      // Wait for session to persist
      let i = 0;
      while (i < 10) {
        const { data: d } = await supabase.auth.getSession();
        if (d.session) break;
        await new Promise(r => setTimeout(r, 200));
        i++;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) throw profileError ?? new Error('Profile not found');

      if (profile.role === 'faculty') router.replace('/faculty');
      else if (profile.role === 'student') router.replace('/student');
      else router.replace('/admin');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Top White Section */}
      <View style={styles.topSection}>
        <Image
          source={require('../assets/images/mit-university-logo.png')}
          style={styles.logo}
        />
        <Text style={styles.universityName}>MIT-ADT{'\n'}UNIVERSITY</Text>
      </View>
      {/* Bottom Purple Section */}
      <LinearGradient
        colors={['#6d1b7b', '#761b89']}
        style={styles.bottomSection}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.welcomeText}>Welcome{'\n'}Back!</Text>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Mail ID"
              placeholderTextColor="#fff"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#fff"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.replace('/signup')}
          >
            <Text style={styles.signupButtonText}>Don&apos;t have an account? Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    
  },
  universityName: {
    color: '#4c136e',
    fontSize: 34,
    fontFamily: 'Metropolis',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 35,
  },
  bottomSection: {
    flex: 1,
    borderTopRightRadius: 60,
    borderTopLeftRadius: 0,
    paddingTop: 32,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    color: '#fff',
    textAlign: 'left',
    marginBottom: 30,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: 'rgba(240, 123, 22, 0.80)',
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(246,168,0,0.5)',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  passwordError: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  signupButton: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});