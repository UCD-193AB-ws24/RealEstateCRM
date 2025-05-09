import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Switch, Image, ActionSheetIOS, ScrollView } from "react-native";
import { Card, Button, Menu, Divider } from "react-native-paper";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import { Provider } from "react-native-paper";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import * as Linking from "expo-linking";
import { Alert, Linking as RNLinking } from "react-native";

const baseUrl = "http://34.31.159.135:5001";
const API_URL = `${baseUrl}/api/leads`;
const IMAGE_UPLOAD_URL = `${baseUrl}/api/uploads`;

const GEOCODING_API_KEY = "";

const getCoordsFromAddress = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GEOCODING_API_KEY}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      console.warn("Geocoding failed:", data.status, address);
      return null;
    }
  } catch (error) {
    console.error("Google Geocoding error:", error);
    return null;
  }
}

export default function LeadListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [leads, setLeads] = useState([]);
  const [region, setRegion] = useState({
    latitude: 37.79066, // Default to Google SF
    longitude: -122.39120,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [user, setUser] = useState(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(null);

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

  useEffect(() => {
    if (!isMapView) {
      fetchLeads();
    }
  }, [isMapView]);

  
  const fetchLeads = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync("user");
      if (!storedUser) return;
  
      const parsedUser = JSON.parse(storedUser);
      const response = await axios.get(`${API_URL}/${parsedUser.id}`);
      const data = response.data;
  
      const leadsWithCoordinates = await Promise.all(
        data.map(async (lead) => {
          if (!lead.latitude || !lead.longitude) {
            const coords = await getCoordsFromAddress(`${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`);
            if (coords) {
              return { ...lead, latitude: coords.latitude, longitude: coords.longitude };
            }
          }
          return lead;
        })
      );
  
      setLeads(leadsWithCoordinates);
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

  const getAccessToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      return token;
    } catch (error) {
      console.error("Error retrieving access token:", error);
      return null;
    }
  }

  const createSheetAndExport = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      alert("Access token not found. Please log in again.");
      return;
    }

    try {

      const sheetTitle = "Leads Export";

      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title: sheetTitle },
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        console.error("Sheet creation failed:", createData);
        alert("Failed to create sheet: " + (createData.error?.message || "Unknown error"));
        return;
      }

      const spreadsheetId = createData.spreadsheetId;

      if (!spreadsheetId) {
        console.warn("No spreadsheetId returned:", createData);
        alert("Sheet created, but couldn't retrieve its ID.");
        return;
      }

      // Step 2: Write the leads data
      const rows = [
        ['Name', 'Address', 'City', 'State', 'Zip', 'Owner', 'Status'],
        ...leads.map(lead => [
          lead.name || '',
          lead.address,
          lead.city,
          lead.state,
          lead.zip,
          lead.owner || '',
          lead.status,
        ]),
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=RAW`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      });

      // alert(`Sheet created! View it here: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      Alert.alert(
        "Export Successful",
        "Your leads have been exported to Google Sheets.",
        [
          {
            text: "Open Sheet",
            onPress: () => RNLinking.openURL(url),
            style: "default",
          },
          {
            text: "OK",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error("Unexpected error during export:", err);
      alert("Something went wrong creating the sheet.");
    }
  }

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
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      
      // Check if running in a simulator
      // const isSimulator = 
      //   location.coords.latitude === 37.785834 && location.coords.longitude === -122.406417;
  
      // setRegion({
      //   latitude: isSimulator ? 38.5449 : location.coords.latitude,
      //   longitude: isSimulator ? -121.7405 : location.coords.longitude,
      //   latitudeDelta: 0.05,
      //   longitudeDelta: 0.05,
      // });
  
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

          {/* <Button mode="contained" style={styles.button} onPress={openActionsMenu}>
            Actions
          </Button> */}

          {/* Export Button */}
          <Button mode="contained" style={styles.button} onPress={createSheetAndExport}>Export</Button>
          {spreadsheetUrl && (
            <Button
              mode="contained"
              style={[styles.button, { marginTop: 10 }]}
              onPress={() => Linking.openURL(spreadsheetUrl)}
            >
              Open Google Sheet
            </Button>
          )}
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
              items={
                Array.from(
                  new Map(
                    leads
                      .filter(lead => lead.city) // remove null/undefined cities
                      .map(lead => {
                        const normalized = lead.city.trim().toLowerCase();
                        return [normalized, { label: lead.city.trim(), value: lead.city.trim() }];
                      })
                  ).values()
                )
              }
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
          <ScrollView>
          {/* {console.log("Filtered Leads:", filteredLeads)} */}
          <FlatList
            data={filteredLeads}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
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
          </ScrollView>
        ) : (
          <>
          {console.log("Rendering map with region:", region)}
          {console.log("Markers:", filteredLeads.map(l => ({ lat: l.latitude, lon: l.longitude })))}
          <MapView provider="google" key={isMapView} style={{ width: "100%", height: 580 }} region={region} showsUserLocation={true}>
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
          </>
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "100%", // Full width of container
  },
  button: {
    backgroundColor: "#A078C4",
    borderRadius: 5,
    flex: 1, // Take up equal space
    height: 40,
    marginHorizontal: 5, // Small horizontal margin between the buttons
  },
  card: { marginBottom: 10, padding: 10, backgroundColor: "#fff" },
  address: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  map: { flex: 1, borderRadius: 10, height: 400 },
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
