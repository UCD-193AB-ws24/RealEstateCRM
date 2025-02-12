import { useState, useEffect } from "react"
import { StyleSheet, View, TextInput, Dimensions, Platform, TouchableOpacity } from "react-native"
import MapView, { Marker } from "react-native-maps"
import * as Location from "expo-location"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

const { width, height } = Dimensions.get("window")

export default function MapScreen() {
  const navigation = useNavigation()
  const [location, setLocation] = useState({
    latitude: 38.5382, // UC Davis coordinates
    longitude: -121.7617,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [markers, setMarkers] = useState([])

  useEffect(() => {
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.log("Permission to access location was denied")
        return
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({})
        setLocation((prev) => ({
          ...prev,
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }))
      } catch (error) {
        console.log("Error getting location:", error)
      }
    })()
  }, [])

  const handleSearch = async () => {
    try {
      const result = await Location.geocodeAsync(searchQuery)
      if (result.length > 0) {
        const { latitude, longitude } = result[0]
        setLocation((prev) => ({
          ...prev,
          latitude,
          longitude,
        }))
        setMarkers([{ coordinate: { latitude, longitude }, title: searchQuery }])
      }
    } catch (error) {
      console.log("Error searching location:", error)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchBar}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search location..."
            placeholderTextColor="#666"
            returnKeyType="search"
          />
        </View>
      </View>

      <MapView
        style={styles.map}
        region={location}
        showsUserLocation={true}
        showsMyLocationButton={true}
        mapType={Platform.OS === "android" ? "none" : "standard"}
      >
        {markers.map((marker, index) => (
          <Marker key={index} coordinate={marker.coordinate} title={marker.title} />
        ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6E6FA",
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBar: {
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  map: {
    width,
    height: height - 140,
  },
})

