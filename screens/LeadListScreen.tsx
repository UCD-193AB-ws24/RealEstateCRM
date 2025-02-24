import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Switch, Image, ActionSheetIOS } from "react-native";
import { Card, Button, Menu, Divider } from "react-native-paper";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import { Provider } from "react-native-paper";


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
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    return (
      (!selectedStatus || lead.status === selectedStatus) &&
      (!selectedCity || lead.city === selectedCity) &&
      (!onlyWithImages || (lead.images && lead.images.length > 0)) &&
      (lead.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())))
    );
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
  
      // if (leadsWithCoordinates.length > 0) {
      //   setRegion({
      //     latitude: leadsWithCoordinates[0].latitude,
      //     longitude: leadsWithCoordinates[0].longitude,
      //     latitudeDelta: 0.05,
      //     longitudeDelta: 0.05,
      //   });
      // }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };


const openActionsMenu = () => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ["Cancel", "Delete Selected Leads", "Contact Owner", "Change Status"],
      cancelButtonIndex: 0,
      destructiveButtonIndex: 1,
    },
    (buttonIndex) => {
      if (buttonIndex === 1) {
        alert("Deleting selected leads...");
      } else if (buttonIndex === 2) {
        alert("Contacting owner...");
      } else if (buttonIndex === 3) {
        alert("Changing status...");
      }
    }
  );
};

  // const filteredLeads = leads.filter((lead) => {
  //   return (
  //     (!selectedStatus || lead.status === selectedStatus) &&
  //     (!selectedCity || lead.city === selectedCity) &&
  //     (!onlyWithImages || (lead.images && lead.images.length > 0)) &&
  //     (lead.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
  //      (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())))
  //   );
  // });

  const exportToCSV = async () => {
    const csvContent = "Name,Address,City,State,Zip,Owner,Status\n" +
      leads.map(lead =>
        `"${lead.name || ""}","${lead.address}","${lead.city}","${lead.state}","${lead.zip}","${lead.owner || ""}","${lead.status}"`
      ).join("\n");

    const fileUri = FileSystem.documentDirectory + "leads.csv";
    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      alert("CSV file saved at: " + fileUri);
    }
  };

  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedCity(null);
    setOnlyWithImages(false);
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
        setRegion({
          latitude: 38.5449,
          longitude: -121.7405,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
  
      // Check if running in a simulator
      const isSimulator = location.coords.latitude === 37.785834 && location.coords.longitude === -122.406417;
  
      setRegion({
        latitude: isSimulator ? 38.5449 : location.coords.latitude,
        longitude: isSimulator ? -121.7405 : location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error("Error getting user location:", error);
    }
  };
  
  

  // const filteredLeads = leads.filter((lead) =>
  //   lead.address.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <Provider>
    <SafeAreaView style={styles.safeContainer}>
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
          {/* 🔹 Filter Controls */}
          <Button mode="contained" style={styles.button} onPress={() => setFiltersVisible(!filtersVisible)}>Filters</Button>

          <Button mode="contained" style={styles.button} onPress={openActionsMenu}>
            Actions
          </Button>

          {/* Export Button */}
          <Button mode="contained" style={styles.button} onPress={exportToCSV}>Export</Button>
        </View>

        {filtersVisible && (
          <View style={styles.filtersContainer}>
            <DropDownPicker
              open={statusOpen}
              value={selectedStatus}
              items={[
                { label: "All", value: null },
                { label: "Lead", value: "Lead" },
                { label: "Contact", value: "Contact" },
                { label: "Offer", value: "Offer" },
                { label: "Sale", value: "Sale" },
              ]}
              setOpen={setStatusOpen}
              setValue={setSelectedStatus}
              placeholder="Filter by Status"
            />

            <DropDownPicker
              open={cityOpen}
              value={selectedCity}
              items={[...new Set(leads.map((lead) => ({ label: lead.city, value: lead.city })))]}
              setOpen={setCityOpen}
              setValue={setSelectedCity}
              placeholder="Filter by City"
            />

            <View style={styles.toggleContainer}>
              <Text>Only With Images</Text>
              <Switch value={onlyWithImages} onValueChange={setOnlyWithImages} />
            </View>

            <View style={styles.buttonRow}>
                <Button mode="contained" onPress={() => setFiltersVisible(false)} style={styles.filterButton}>Close</Button>
                <Button mode="contained" onPress={resetFilters} style={styles.filterButton}>Reset</Button>
              </View>
          </View>
        )}

        {!isMapView ? (
          <FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate("LeadDetails", { lead: item })}>
                <Card style={styles.card}>
                  {item.images.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} style={styles.leadImage} />
                  ) : (
                    <MaterialIcons name="house" size={100} color="#ccc" style={styles.houseIcon} />
                  )}
                  <Text style={styles.address}>
                    {item.name ? item.name : item.address.split(",")[0]}
                  </Text>
                  <Text>Owner: {item.owner}</Text>
                  <Text>Status: {item.status}</Text>
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
    </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#DFC5FE" },
  container: { padding: 10, backgroundColor: "#DFC5FE" },
  searchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10, backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  toggleText: { fontSize: 14, marginRight: 5, fontWeight: "bold" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  button: { backgroundColor: "#A078C4", borderRadius: 5, maxWidth: 100, height: 40 },
  card: { marginBottom: 10, padding: 10, backgroundColor: "#fff" },
  address: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  map: { flex: 1, borderRadius: 10 },
  leadImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  houseIcon: { alignSelf: "center", marginVertical: 20 },
  noImageText: { fontSize: 14, color: "gray", textAlign: "center", marginTop: 10 },
  filterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  filtersContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    zIndex: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    height: 220,  // Makes it taller
    width: "80%", // Reduces width slightly
  },
  filterButton: { backgroundColor: "#A078C4", borderRadius: 5, flex: 1, marginHorizontal: 5 },
});

export default LeadListScreen;
