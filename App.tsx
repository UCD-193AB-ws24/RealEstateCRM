import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PropertyProvider } from "./contexts/PropertyContext";
import { LogBox } from "react-native";

import {
  Home,
  Car,
  Bookmark,
  User,
} from "react-native-feather"; // ✅ Feather icons
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import AddPropertyScreen from "./screens/AddPropertyScreen";
import CameraScreen from "./screens/CameraScreen";
import GalleryScreen from "./screens/GalleryScreen";
import MapScreen from "./screens/MapScreen";
import LeadListScreen from "./screens/LeadListScreen";
import LeadDetailScreen from "./screens/LeadDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";

LogBox.ignoreAllLogs();

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
          const iconProps = { stroke: color, width: size, height: size };

          if (route.name === "Home") return <Home {...iconProps} />;
          if (route.name === "Drive") return <Car {...iconProps} />;
          if (route.name === "Leads") return <Bookmark {...iconProps} />;
          if (route.name === "Profile") return <User {...iconProps} />;
        },
        tabBarActiveTintColor: "#A078C4",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Drive"
        component={DriveStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadListScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// 📌 Main App with Stack Navigation
export default function App() {
  return (
    <PropertyProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen name="DriveStack" component={DriveStack} />
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
