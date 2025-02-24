import { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function DriveScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null); // New state for map region
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [pins, setPins] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(0.01); // Initial zoom level

  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Location permission denied, using default Davis location.");
          return;
        }
  
        let location = await Location.getCurrentPositionAsync({});
        const isSimulator = location.coords.latitude === 37.785834 && location.coords.longitude === -122.406417;
  
        const newRegion = isSimulator
          ? { latitude: 38.5449, longitude: -121.7405, latitudeDelta: zoomLevel, longitudeDelta: zoomLevel }
          : { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: zoomLevel, longitudeDelta: zoomLevel };
  
        setRegion(newRegion);
        setLocation(newRegion); // ✅ Ensure location is set
      } catch (error) {
        console.error("Error getting user location:", error);
      }
    };
  
    getLocation();
  }, [zoomLevel]);

  const dropPin = () => {
    if (!region) return; // Make sure region is set
  
    const newPin = { latitude: region.latitude, longitude: region.longitude };
    console.log("Dropping pin at:", newPin);
    setPins([...pins, newPin]);
  
    // ✅ Navigate to "AddPropertyScreen" with location data
    navigation.navigate("DriveStack", { screen: "AddPropertyScreen", params: newPin });

  };

  // 🔍 **Zoom In**
  const zoomIn = () => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 0.002)); // Prevents infinite zoom
  };

  // 🔍 **Zoom Out**
  const zoomOut = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 0.1)); // Prevents infinite zoom out
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region} // ✅ Ensures map updates properly
        showsUserLocation={true}
      >
        <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="blue" />
        {pins.map((pin, index) => (
          <Marker key={index} coordinate={pin} pinColor="red" />
        ))}
      </MapView>

      {/* 🔍 Zoom In & Out Buttons */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
          <Ionicons name="remove" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 📍 Drop Pin Button */}
      <TouchableOpacity style={styles.pinButton} onPress={dropPin}>
        <Ionicons name="location-sharp" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  
  pinButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "red",
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  zoomControls: {
    position: "absolute",
    bottom: 90, // Moves above pin button
    right: 20,
  },
  zoomButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10, // Space between buttons
    alignItems: "center",
    justifyContent: "center",
  },
});
