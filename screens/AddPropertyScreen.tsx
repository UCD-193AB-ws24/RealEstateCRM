import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from "react-native-dropdown-picker";



// const API_URL = "http://localhost:5001/api/leads";
// const IMAGE_UPLOAD_URL = "http://localhost:5001/api/upload";

const baseUrl = "http://34.31.159.135:5002";
const API_URL = `${baseUrl}/api/leads`;
const IMAGE_UPLOAD_URL = `${baseUrl}/api/upload`;

const AddPropertyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { latitude, longitude } = route.params || {};

  const isFromMap = !!latitude && !!longitude;

  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [firstImageUri, setFirstImageUri] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [owner, setOwner] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];


  useEffect(() => {
    if (isFromMap) {
      getAddressFromCoords(latitude, longitude);
    }

    // const fetchUser = async() => {
    //   try {
    //     const storedUser = await SecureStore.getItemAsync("user");
    //     if (!storedUser) return;
    //     const parsedUser = JSON.parse(storedUser);
    //     setUserId(parsedUser.id); // Set user ID from stored data
    //     console.log("🔥 Fetched user ID:", parsedUser.id);
    //   } catch (error) {
    //     console.error("Failed to fetch user:", error);
    //   }
    // };

    // fetchUser();
  }, [latitude, longitude]);

  const pickImage = async (useCamera = false) => {
    let result;

    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        quality: 1,
        base64: true,
        exif: true,  // get image metadata
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 1,
        base64: true,
        exif: true,
      });
    }

    if (!result.canceled) {
      const selectedAssets = result.assets ?? [result];

      const base64Images = selectedAssets.map(asset => {
        return `data:image/jpeg;base64,${asset.base64}`;
      });

      setImages(prev => [...prev, ...base64Images]);

      // const newImages = result.assets ? result.assets.map(img => img.uri) : [result.uri];
      // setImages([...images, ...newImages]);

      // // Use first image's metadata for autofill if no previous autofill
      if (!isFromMap && !firstImageUri && result.assets && result.assets.length > 0) {
        setFirstImageUri(result.assets[0].uri);
      
        const { GPSLatitude, GPSLongitude } = result.assets[0].exif || {};
        console.log("gps info", result.assets[0].exif);
        console.log("GPS lat", GPSLatitude);
      
        if (GPSLatitude && GPSLongitude) {
          // Reverse longitude if it's in the Eastern Hemisphere
          let latitude = GPSLatitude;
          let longitude = GPSLongitude;
      
          if (longitude > 0) {
            console.log("Reversing longitude for Western Hemisphere");
            longitude = longitude * -1;
          }
      
          console.log("Final GPS coords:", latitude, longitude);
          getAddressFromCoords(latitude, longitude);
        }
      }
    }
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const apiKey = "";
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
  
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.status === "OK") {
        const result = data.results.find(r => r.types.includes("street_address") || r.types.includes("premise") || r.types.includes("route") || r.types.includes("subpremise"));
        if (!result) {
          console.warn("No valid address result found");
          return;
        }
        const components = result.address_components;
        // console.log("components", components);
  
        const getComponent = (type) => {
          const comp = components.find(c => c.types.includes(type));
          return comp ? comp.long_name : "";
        };

        // console.log("get component", getComponent);
  
        setAddress(getComponent("street_number") + " " + getComponent("route"));
        setCity(getComponent("locality") || getComponent("sublocality"));
        setState(getComponent("administrative_area_level_1"));
        setZip(getComponent("postal_code"));
      } else {
        console.warn("Google Geocoding failed:", data.status);
      }
    } catch (error) {
      console.error("Error with Google Geocoding:", error);
    }
  };
  

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);

    // If removed image was the first image, use the next image for autofill
    if (firstImageUri === images[index] && updatedImages.length > 0) {
      setFirstImageUri(updatedImages[0]);
      // Here we assume metadata is available for autofill; ideally, we'd check for exif data
    } else if (updatedImages.length === 0) {
      setFirstImageUri(null);
    }
  };

  const uploadImage = async (uri, address, city, state, zip, owner) => {
    let formData = new FormData();
  
    formData.append("file", {
      uri,
      name: "property.jpg",
      type: "image/jpeg",
    });
  
    formData.append("address", address.toString());
    formData.append("city", city.toString());
    formData.append("state", state.toString());
    formData.append("zip", zip.toString());
    formData.append("owner", owner.toString());
  
    try {
      let response = await fetch(IMAGE_UPLOAD_URL, {
        method: "POST",
        body: formData,
        headers: {
          // ⚠️ DO NOT manually set "Content-Type" for multipart/form-data
          "Accept": "application/json",
        },
      });
  
      let data = await response.json();
      // console.log("server response:", data);

      if (!response.ok) throw new Error("Upload failed: " + JSON.stringify(data));
  
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };
  

  // Function to add property to database
  const handleAddProperty = async () => {
    setIsLoading(true); 
    const storedUser = await SecureStore.getItemAsync("user");
    if (!storedUser) return;
  
    const parsedUser = JSON.parse(storedUser);
    const userId = parsedUser.id;
  
    // Trim inputs for validation
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedZip = zip.trim();
    const trimmedOwner = owner.trim();
  
    if (!trimmedName || !trimmedAddress || !trimmedCity || !trimmedState || !trimmedZip || !trimmedOwner) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
  
    if (!/^\d{5}$/.test(trimmedZip)) {
      Alert.alert("Invalid Zip Code", "Please enter a valid 5-digit zip code.");
      return;
    }
  
    const newLead = {
      name: trimmedName,
      address: trimmedAddress,
      city: trimmedCity,
      state: trimmedState,
      zip: trimmedZip,
      owner: trimmedOwner,
      images: images.length > 0 ? images : [],
      userId,
      notes,
      isPending: true,
      id: Date.now(), // temporary local ID in case API fails
    };

    // ✅ Update cachedLeads in AsyncStorage
  try {
    const existing = await AsyncStorage.getItem("cachedLeads");
    const leads = existing ? JSON.parse(existing) : [];
    const updatedLeads = [newLead, ...leads];
    await AsyncStorage.setItem("cachedLeads", JSON.stringify(updatedLeads));
    console.log("✅ Added new lead to cachedLeads");
  } catch (error) {
    console.warn("⚠️ Failed to update cachedLeads:", error);
  }

  // ✅ Update cachedStats in AsyncStorage
  try {
    const cached = await AsyncStorage.getItem("cachedStats");
    const stats = cached ? JSON.parse(cached) : {};
    const updatedStats = {
      ...stats,
      totalLeads: (stats.totalLeads || 0) + 1,
      activeListings: (stats.activeListings || 0) + 1,
    };
    await AsyncStorage.setItem("cachedStats", JSON.stringify(updatedStats));
    console.log("📊 Updated cachedStats:", updatedStats);
    navigation.navigate("Home", { optimisticStats: updatedStats });
  } catch (error) {
    console.warn("⚠️ Failed to update cachedStats:", error);
  }

  
    // 🚀 Navigate back to Home with optimisticStats
    setIsLoading(false);
  
    // 🔄 Send to backend
    try {
      Alert.alert("Success", "Property added successfully!");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
  
      if (!response.ok) throw new Error("Failed to add property");
      const data = await response.json();
  
    } catch (error) {
      console.error("❌ Error adding property:", error);
      Alert.alert("Error", "Failed to add property.");
    }
  };
  

  return (
    <SafeAreaView style={styles.safeContainer}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2b7fff" />
          <Text style={styles.loadingText}>Uploading property...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          {/* All your form content here */}
          <View style={styles.photoButtonContainer}>
            <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
              <Text style={styles.photoButtonText}>Take a Picture</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
              <Text style={styles.photoButtonText}>Select from Gallery</Text>
            </TouchableOpacity>
          </View>
  
          {images.length > 0 && (
            <ScrollView horizontal style={styles.imageScroll}>
              {images.map((imgUri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: imgUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeButtonText}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
  
          <ScrollView>
            <Text style={styles.label}>Property Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter property name (e.g., 4 bed 4 bath)" />
  
            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter address" />
  
            <Text style={styles.label}>City</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Enter city" />
  
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    style={styles.input}
                    value={state}
                    onChangeText={setState}
                    placeholder="State"
                  />
                </View>

                <View style={styles.halfWidth}>
                  <TextInput
                    style={styles.input}
                    value={zip}
                    onChangeText={setZip}
                    placeholder="Zip Code"
                    keyboardType="numeric"
                  />
                </View>
              </View>

  
            <Text style={styles.label}>Owner</Text>
            <TextInput style={styles.input} value={owner} onChangeText={setOwner} placeholder="Enter owner's name" />
  
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional details..."
              multiline
            />
  
            <TouchableOpacity style={styles.addButton} onPress={async () => {
              setIsLoading(true); // ✅ Trigger loading state
              await handleAddProperty();
              setIsLoading(false); // 🟣 Done
            }}>
              <Text style={styles.addButtonText}>Add Property</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
  
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F9F5FF",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    color: "#374151", // slate-700
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB", // gray-200
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    fontSize: 14,
    color: "#111827", // slate-900
  },
  loadingContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#F9F5FF",
},
loadingText: {
  marginTop: 10,
  fontSize: 16,
  color: "#6B7280",
},
pickerContainer: {
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 8,
  marginTop: 6,
  backgroundColor: "#FFFFFF",
  overflow: "hidden", // fixes text overflow
  height: 50, // consistent height
  justifyContent: "center",
},
picker: {
  height: 50,
  width: "100%",
  color: "#111827",
},

row: {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 10,
  marginTop: 6,
},
halfWidth: {
  width: "48%",
},
dropdown: {
  borderColor: "#E5E7EB",
  minHeight: 48,
},
dropdownList: {
  borderColor: "#E5E7EB",
  zIndex: 1000,
},

halfInputContainer: {
  flex: 1,
},
  addButton: {
    marginTop: 24,
    backgroundColor: "#2b7fff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  photoButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#2b7fff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },
  photoButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  imageScroll: {
    flexDirection: "row",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 6,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FFFFFF",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB", // gray-300
  },
  removeButtonText: {
    color: "#6B7280", // gray-500
    fontSize: 16,
    fontWeight: "bold",
  },
});


export default AddPropertyScreen;
