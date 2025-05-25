import React, { useState, useEffect, useRef } from "react";
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
import Carousel from "react-native-snap-carousel";
import { Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

const ITEMS_PER_PAGE = 5;

const baseUrl = "http://34.31.159.135:5002";
const API_URL = `${baseUrl}/api/leads`;
const IMAGE_UPLOAD_URL = `${baseUrl}/api/uploads`;

const GEOCODING_API_KEY = "";

const ImageCarousel = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        ref={carouselRef}
        data={images}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
        sliderWidth={screenWidth - 40}
        itemWidth={screenWidth - 40}
        onSnapToItem={(index) => setActiveIndex(index)}
      />

      {/* Left Arrow */}
      {activeIndex > 0 && (
        <TouchableOpacity
          style={styles.arrowLeft}
          onPress={() => carouselRef.current?.snapToPrev()}
        >
          <Ionicons name="chevron-back" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* Right Arrow */}
      {activeIndex < images.length - 1 && (
        <TouchableOpacity
          style={styles.arrowRight}
          onPress={() => carouselRef.current?.snapToNext()}
        >
          <Ionicons name="chevron-forward" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* Pagination & Counter Overlay */}
      <View style={styles.overlay}>
      <View style={styles.dotWrapper}>
        {images.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, activeIndex === idx && styles.activeDot]}
          />
        ))}
      </View>
      <Text style={styles.counter}>{`${activeIndex + 1} / ${images.length}`}</Text>
    </View>
    </View>
  );
};


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

const deduplicateLeads = (existing, incoming) => {
  const merged = [...existing, ...incoming];
  const uniqueMap = new Map();
  for (let lead of merged) {
    uniqueMap.set(lead.id, lead);
  }
  return Array.from(uniqueMap.values());
};


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
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastSheetTitle, setLastSheetTitle] = useState("");
  const [renderedCount, setRenderedCount] = useState(ITEMS_PER_PAGE);
  const [visibleLeads, setVisibleLeads] = useState([]);
  const [allFilteredLeads, setAllFilteredLeads] = useState([]);


    const isFocused = useIsFocused();
    const route = useRoute();

  useEffect(() => {
    if (isFocused) {
      if (route.params?.refresh) {
        console.log("🔄 Refreshing lead list from navigation param...");
        fetchLeads();
        navigation.setParams({ refresh: false }); // Reset after refreshing
      }
    }
  }, [isFocused, route.params?.refresh]);


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
    const updated = leads.filter((lead) => {
      return (
        (!selectedStatus || lead.status === selectedStatus) &&
        (!selectedCity || lead.city === selectedCity) &&
        (!onlyWithImages || (lead.images && lead.images.length > 0)) &&
        (lead.address.toLowerCase().includes(searchQuery.toLowerCase()) || 
         (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    });
    setAllFilteredLeads(updated);
    setVisibleLeads(updated.slice(0, ITEMS_PER_PAGE));
    setRenderedCount(ITEMS_PER_PAGE);
  }, [leads, searchQuery, selectedStatus, selectedCity, onlyWithImages]);

  const handleLoadMoreLocal = () => {
    const nextCount = renderedCount + ITEMS_PER_PAGE;
    const moreToShow = allFilteredLeads.slice(0, nextCount);
    setVisibleLeads(moreToShow);
    setRenderedCount(nextCount);
  };


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

  
  const fetchLeads = async (pageParam = 1) => {
    setLoading(true);
  
    try {
      const storedUser = await SecureStore.getItemAsync("user");
      if (!storedUser) return;
  
      const parsedUser = JSON.parse(storedUser);
      const response = await axios.get(`${API_URL}/${parsedUser.id}?page=${pageParam}&limit=10`);
      const data = response.data;
      console.log("✅ API response received:", data.length);
  
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
  
      if (pageParam === 1) {
        setLeads(leadsWithCoordinates);
      } else {
        setLeads((prev) => deduplicateLeads(prev, leadsWithCoordinates));
      }
  
      setPage(pageParam);
      setHasMore(data.length === 10);
    } catch (error) {
      console.error("❌ Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };
  
  

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLeads(page + 1);
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

  const getAccessToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      return token;
    } catch (error) {
      console.error("Error retrieving access token:", error);
      return null;
    }
  }

  const promptSheetName = () => {
    return new Promise((resolve) => {
      let input = lastSheetTitle || "Leads Export";

      Alert.prompt(
        "Sheet Name",
        "Enter the name for the Google Sheet",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(null),
          },
          {
            text: "OK",
            onPress: (text) => resolve(text || input),
          },
        ],
        "plain-text",
        input
      );
    });
  };

  const createSheetAndExport = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      alert("Access token not found. Please log in again.");
      return;
    }

    const sheetTitle = await promptSheetName();
    if (!sheetTitle) return;

    setLastSheetTitle(sheetTitle);

    try {
      const storedSheets = JSON.parse(await SecureStore.getItemAsync("sheetMap") || "{}");
      let spreadsheetId = storedSheets[sheetTitle];
      console.log(spreadsheetId);

      if (!spreadsheetId) {
        console.log("Using access token:", accessToken);
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST', // ✅ also fix: method should be POST, not PUT
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: { title: sheetTitle },
          }),
        });
        
        if (!createRes.ok) {
          const errorText = await createRes.text();
          console.error("Sheet creation failed:", errorText);
          alert("Failed to create sheet.");
          return;
        }
        
        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
        

        if (!createRes.ok || !spreadsheetId) {
          console.error("Sheet creation failed:", createData);
          alert("Failed to create sheet.");
          return;
        }
  
        storedSheets[sheetTitle] = spreadsheetId;
        await SecureStore.setItemAsync("sheetMap", JSON.stringify(storedSheets));
      }

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
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
        body: JSON.stringify({ values: rows }),
      });
  
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      Alert.alert("Export Successful", "Leads exported successfully.", [
        { text: "Open Sheet", onPress: () => RNLinking.openURL(url) },
        { text: "OK", style: "cancel" }
      ]);
    } catch (err) {
      console.error("Error exporting sheet:", err);
      alert("Something went wrong.");
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
          <Switch
            value={isMapView}
            onValueChange={() => setIsMapView(!isMapView)}
            trackColor={{ false: "#D1D5DB", true: "#C4B5FD" }} // light violet track
            thumbColor={isMapView ? "#2b7fff" : "#f4f3f4"}     // blue thumb
          />

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
  <View style={{ zIndex: 4000 }}>
    <View style={styles.filtersContainer}>
    <View style={styles.toggleRow}>
        <View style={styles.toggleContainer}>
          <Text>Only With Images</Text>
          <Switch value={onlyWithImages} onValueChange={setOnlyWithImages} />
        </View>
        <Button mode="contained" onPress={resetFilters} style={styles.resetButton}>Reset</Button>
      </View>
      <View style={styles.filterRow}>
        <View style={[styles.halfWidth, { zIndex: statusOpen ? 3000 : 1000 }]}>
          <DropDownPicker
            open={statusOpen}
            value={selectedStatus}
            items={[
              { label: "Lead", value: "Lead" },
              { label: "Contact", value: "Contact" },
              { label: "Offer", value: "Offer" },
              { label: "Sale", value: "Sale" },
            ]}
            setOpen={setStatusOpen}
            setValue={setSelectedStatus}
            placeholder="Filter by Status"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownList}
          />
        </View>

        <View style={styles.halfWidth}>
        <DropDownPicker
          open={cityOpen}
          value={selectedCity}
          items={Array.from(
            new Map(
              leads
                .filter(lead => lead.city)
                .map(lead => [lead.city.trim().toLowerCase(), {
                  label: lead.city.trim(),
                  value: lead.city.trim()
                }])
            ).values()
          )}
          setOpen={setCityOpen}
          setValue={setSelectedCity}
          placeholder="Filter by City"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
        />

        </View>
      </View>

    </View>
  </View>
)}


        {!isMapView ? (
          <ScrollView>
          {/* {console.log("Filtered Leads:", filteredLeads)} */}
          <FlatList
    data={visibleLeads}
    keyExtractor={(item) => item.id.toString()}
    contentContainerStyle={{ paddingBottom: 100 }}
    renderItem={({ item }) => (
      <TouchableOpacity onPress={() => navigation.navigate("LeadDetails", { lead: item })}>
        <Card style={styles.card}>
          {item.images && item.images.length > 0 ? (
            <ImageCarousel images={item.images} />
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
    onEndReached={handleLoadMoreLocal}
    onEndReachedThreshold={0.6}
    ListFooterComponent={loading && hasMore ? (
      <Text style={{ textAlign: "center", padding: 10, color: "#2b7fff" }}>Loading leads...</Text>
    ) : null}
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

          <View style={{ position: "absolute", bottom: 10, width: "100%", paddingBottom: 20 }}>
            <FlatList
              data={filteredLeads}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    if (item.latitude && item.longitude) {
                      setRegion({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      });
                    }
                  }}
                >
                  <Card style={{ marginRight: 10, width: 250 }}>
                    {item.images?.length > 0 ? (
                      <Image source={{ uri: item.images[0] }} style={{ height: 120, width: "100%", borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
                    ) : (
                      <View style={{ height: 120, justifyContent: "center", alignItems: "center", backgroundColor: "#eee" }}>
                        <MaterialIcons name="house" size={50} color="#888" />
                      </View>
                    )}
                    <View style={{ padding: 10 }}>
                      <Text style={{ fontWeight: "bold" }}>{item.name || item.address.split(",")[0]}</Text>
                      <Text style={{ color: "#666" }}>{item.city}</Text>
                      <Text>Status: {item.status}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
            />
          </View>
          </>
        )}
      </View>
    </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F9F5FF", // light lavender background
  },
  container: {
    padding: 10,
    backgroundColor: "#F9F5FF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  carouselContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  arrowLeft: {
    position: "absolute",
    top: "50%",
    left: 10,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 4,
  },
  arrowRight: {
    position: "absolute",
    top: "50%",
    right: 10,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 4,
  },
  overlay: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dotWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "#D1D5DB",
  },
  activeDot: {
    backgroundColor: "#7C3AED",
  },
  counter: {
    position: "absolute",
    right: 12,
    bottom: -3,
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    fontWeight: "600",
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },  
  searchIcon: {
    marginRight: 8,
    color: "#7C3AED",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  toggleText: {
    fontSize: 13,
    marginRight: 5,
    fontWeight: "600",
    color: "#6B7280",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    width: "100%",
  },
  button: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    flex: 1,
    height: 40,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  filterButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    height: 40,
    justifyContent: "center",
  },
  card: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownList: {
    borderColor: "#ccc",
    position: "absolute",
    zIndex: 5000,
    elevation: 10, // for Android
  },
  address: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 10,
  },
  map: {
    flex: 1,
    borderRadius: 10,
    height: 400,
  },
  leadImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  houseIcon: {
    alignSelf: "center",
    marginVertical: 20,
  },
  noImageText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16, // maintain left/right spacing
    paddingBottom: 12,
    borderRadius: 12,
    marginVertical: 6,     // optional: reduce vertical margin too
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    alignSelf: "center",
    overflow: "visible",
    zIndex: 1000,
    position: 'relative',
  }, 
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  
  resetButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    alignItems: "center",
    gap: 10,
  },
  halfWidth: {
    width: "48%",
  },
  
  dropdown: {
    borderColor: "#ccc",
    minHeight: 40,
  },
  
  dropdownList: {
    borderColor: "#ccc",
    zIndex: 9999,
  },
  
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
    gap: 10,
  },
});


export default LeadListScreen;
