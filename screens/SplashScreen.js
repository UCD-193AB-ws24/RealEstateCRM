// SplashScreen.js
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const baseUrl = "http://34.31.159.135:5001/api/stats";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const prepare = async () => {
        console.log("🟣 Running SplashScreen logic...");
        try {
          const storedUser = await SecureStore.getItemAsync("user");
          console.log("👤 Stored user:", storedUser);
      
          if (!storedUser) {
            console.log("🟥 No user found, going to Login");
            navigation.replace("Login");
            return;
          }
      
          const user = JSON.parse(storedUser);
          const response = await axios.get(`${baseUrl}/${user.id}`);
          console.log("📊 Stats fetched:", response.data);
      
          await AsyncStorage.setItem("cachedStats", JSON.stringify(response.data));
          console.log("✅ Stats cached. Navigating to Home...");
      
          navigation.replace("MainTabs", {
            screen: "Home",
            params: { optimisticStats: response.data },
          });
        } catch (err) {
          console.error("❌ Splash loading error:", err);
          navigation.replace("MainTabs", { screen: "Home" });
        }
      };
      

    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F5FF",
    justifyContent: "center",
    alignItems: "center",
  },
});
