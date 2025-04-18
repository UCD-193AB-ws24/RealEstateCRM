import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PropertyProvider } from "./contexts/PropertyContext";

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
        tabBarIcon: ({ color }) => {
          let icon = "❓";
          if (route.name === "Home") icon = "🏠";
          else if (route.name === "Drive") icon = "🚗";
          else if (route.name === "Leads") icon = "🔖";
          else if (route.name === "Profile") icon = "👤";

          return <Text style={{ color, fontSize: 18 }}>{icon}</Text>;
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

export default function App() {
  return (
    <PropertyProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen name="DriveStack" component={DriveStack} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
          <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
          <Stack.Screen name="CameraScreen" component={CameraScreen} />
          <Stack.Screen name="GalleryScreen" component={GalleryScreen} />
          <Stack.Screen name="LeadDetails" component={LeadDetailScreen} />
          <Stack.Screen name="LeadListScreen" component={LeadListScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PropertyProvider>
  );
}
