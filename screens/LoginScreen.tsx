import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Image } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [userInfo, setUserInfo] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "677796464036-lcia79vgc4akv50inc89tr86mg06e7un.apps.googleusercontent.com",
  });
  useEffect(() => {
    console.log("Google Auth Response:", response);
    if (response?.type === "success") {
      const { authentication } = response;
      getUserInfo(authentication.accessToken);
    }
  }, [response]);

  useEffect(() => {
    const checkUser = async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
        navigation.replace("MainTabs");
      }
    };
    checkUser();
  }, []);
  

  async function getUserInfo(token) {
    try {
      const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
  
      console.log("🔥 User Info from Google:", user); // Debugging
  
      setUserInfo(user);
      await SecureStore.setItemAsync("user", JSON.stringify(user));
  
      // Send user data to backend
      const response = await fetch("http://localhost:5001/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
  
      const data = await response.json();
      console.log("✅ Response from backend:", data); // Debugging
  
      navigation.replace("MainTabs"); // Redirect to main app
    } catch (error) {
      console.error("❌ Error fetching user info:", error);
    }
  }
  
  
  return (
    <View style={styles.container}>
      {userInfo ? (
        <View style={styles.profileContainer}>
          <Image source={{ uri: userInfo.picture }} style={styles.image} />
          <Text style={styles.text}>Welcome, {userInfo.name}!</Text>
        </View>
      ) : (
        <Button title="Sign in with Google" onPress={() => promptAsync()} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileContainer: { alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  image: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
});
