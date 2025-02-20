import { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, Dimensions, Platform, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window")

export default function DriveScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [pins, setPins] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Start tracking location
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (newLocation) => {
          setRouteCoordinates((prev) => [...prev, newLocation.coords]);
          setLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      );
    })();
  }, []);

  const dropPin = () => {
    if (!location) return;

    const newPin = {
      latitude: location.latitude,
      longitude: location.longitude,
    };
    setPins([...pins, newPin]);

    // Navigate to AddPropertyScreen with location data
    navigation.navigate("AddPropertyScreen", {
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={location} showsUserLocation={true}>
        <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor="blue" />
        {pins.map((pin, index) => (
          <Marker key={index} coordinate={pin} pinColor="red" />
        ))}
      </MapView>

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
});