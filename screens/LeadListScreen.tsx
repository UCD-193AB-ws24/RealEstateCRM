import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Switch, Image } from "react-native";
import { Card, Button } from "react-native-paper";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const API_URL = "http://localhost:5001/api/leads";
const IMAGE_UPLOAD_URL = "https://localhost:5001/api/uploads";

export default function LeadListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [leads, setLeads] = useState([]);
  const [region, setRegion] = useState({
    latitude: 38.5449, // Default to Davis, CA
    longitude: -121.7405,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchLeads();
      getUserLocation();
    });

    return unsubscribe;
  }, [navigation]);

  
  const fetchLeads = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log("Fetched leads:", data);
  
      // Convert addresses to lat/lng
      const leadsWithCoordinates = await Promise.all(
        data.map(async (lead) => {
          let geocode = await Location.geocodeAsync(`${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`);
          if (geocode.length > 0) {
            return { ...lead, latitude: geocode[0].latitude, longitude: geocode[0].longitude };
          } else {
            return lead; // Keep the lead if geocoding fails
          }
        })
      );
  
      setLeads(leadsWithCoordinates);
  
      if (leadsWithCoordinates.length > 0) {
        setRegion({
          latitude: leadsWithCoordinates[0].latitude,
          longitude: leadsWithCoordinates[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };
  
  const uploadImage = async (uri, address, city, state, zip, owner) => {
    let formData = new FormData();
  
    formData.append("file", {
      uri,
      name: "property.jpg",
      type: "image/jpeg",
    });
  
    // ✅ FIX: Explicitly append text fields
    formData.append("address", String(address));
    formData.append("city", String(city));
    formData.append("state", String(state));
    formData.append("zip", String(zip));
    formData.append("owner", String(owner));
  
    try {
      let response = await fetch(IMAGE_UPLOAD_URL, {
        method: "POST",
        body: formData,
        headers: {
          // ⚠️ DO NOT manually set "Content-Type" for multipart/form-data
        },
      });
  
      let data = await response.json();
      if (!response.ok) throw new Error("Upload failed: " + JSON.stringify(data));
  
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };
  


  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission denied, using default Davis location.");
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
  
      // Check if running in a simulator
      const isSimulator = location.coords.latitude === 37.785834 && location.coords.longitude === -122.406417;
  
      if (isSimulator) {
        console.warn("Simulator detected. Forcing location to Davis, CA.");
        setRegion({
          latitude: 38.5449,
          longitude: -121.7405,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error("Error getting user location:", error);
    }
  };
  

  const filteredLeads = leads.filter((lead) =>
    lead.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
        <TextInput
          placeholder="Search Leads..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.toggleText}>{isMapView ? "Map" : "List"}</Text>
        <Switch value={isMapView} onValueChange={() => setIsMapView(!isMapView)} />
      </View>

      <View style={styles.buttonRow}>
        <Button mode="contained" style={styles.button}>Filters</Button>
        <Button mode="contained" style={styles.button}>Actions</Button>
        <Button mode="contained" style={styles.button}>Export</Button>
      </View>

      {!isMapView ? (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate("LeadDetails", { lead: item })}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.address}>{item.address}</Text>
                  <Text>{item.city}, {item.state} {item.zip}</Text>
                  <Text>Owner: {item.owner}</Text>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.leadImage} />
                  ) : null}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
        />
      ) : (
        <MapView style={styles.map} region={region} showsUserLocation={true}>
          {filteredLeads.map((lead, index) => (
            lead.latitude && lead.longitude && (
              <Marker
                key={index}
                coordinate={{ latitude: lead.latitude, longitude: lead.longitude }}
                title={lead.address}
                description={`${lead.city}, ${lead.state} ${lead.zip}`}
              />
            )
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#DFC5FE" },
  searchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10, backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  toggleText: { fontSize: 14, marginRight: 5, fontWeight: "bold" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  button: { backgroundColor: "#A078C4", borderRadius: 5, maxWidth: 100, height: 40 },
  card: { marginBottom: 10, padding: 10, backgroundColor: "#fff" },
  address: { fontSize: 16, fontWeight: "bold" },
  map: { flex: 1, borderRadius: 10 },
  leadImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
});

export default LeadListScreen;
