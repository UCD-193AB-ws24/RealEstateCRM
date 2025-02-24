import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PropertyProvider } from "./contexts/PropertyContext";
import { Ionicons } from "@expo/vector-icons"; // Import icons for bottom tabs
import * as SecureStore from "expo-secure-store";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import AuthScreen from "./screens/AuthScreen";

import HomeScreen from "./screens/HomeScreen";
import PropertyDetailScreen from "./screens/PropertyDetailScreen";
import LoginScreen from "./screens/LoginScreen";
import AddPropertyScreen from "./screens/AddPropertyScreen";
import CameraScreen from "./screens/CameraScreen";
import GalleryScreen from "./screens/GalleryScreen";
import MapScreen from "./screens/MapScreen";
import LeadListScreen from "./screens/LeadListScreen";
import LeadDetailScreen from "./screens/LeadDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function DriveStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriveScreen" component={MapScreen} />
      <Stack.Screen name="AddPropertyScreen" component={AddPropertyScreen} />
    </Stack.Navigator>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-sharp";
          else if (route.name === "Drive") iconName = "car-sharp";
          else if (route.name === "Leads") iconName = "bookmark-sharp";
          else if (route.name === "Profile") iconName = "person-sharp";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#A078C4",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Drive" component={DriveStack} options={{ headerShown: false }} />
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Leads" component={LeadListScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// 📌 **Main App with Stack Navigation**
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const storedUser = await SecureStore.getItemAsync("userToken");
      if (storedUser) setUser(storedUser);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser ? authenticatedUser.uid : null);
      setLoading(false);
    });

    checkLogin();
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <PropertyProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* ✅ If NOT logged in, show AuthScreen */}
          {!user ? (
            <Stack.Screen name="AuthScreen" component={AuthScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={BottomTabs} />
              <Stack.Screen name="DriveStack" component={DriveStack} />
              <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
              <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
              <Stack.Screen name="CameraScreen" component={CameraScreen} />
              <Stack.Screen name="GalleryScreen" component={GalleryScreen} />
              <Stack.Screen name="LeadDetails" component={LeadDetailScreen} />
              <Stack.Screen name="LeadListScreen" component={LeadListScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PropertyProvider>
  );
}
