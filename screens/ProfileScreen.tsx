import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Button } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("user");
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Image source={{ uri: user.picture }} style={styles.image} />
          <Text style={styles.title}>{user.name}</Text>
          <Text>{user.email}</Text>
          <Button title="Logout" onPress={handleLogout} />
        </>
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  image: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
});
