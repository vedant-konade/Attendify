import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

const HomePage = () => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push('/signup')}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(76, 19, 110, 1)', 'rgba(118, 27, 137, 1)']}
        style={styles.gradient}
      >
        <Image
          source={require('../assets/images/mit-university-logo.png')}
          style={styles.logo}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  }
});

export default HomePage;