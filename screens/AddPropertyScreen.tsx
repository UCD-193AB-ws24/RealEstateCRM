import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { SafeAreaView } from "react-native-safe-area-context";

// const API_URL = "http://localhost:5001/api/leads";
// const IMAGE_UPLOAD_URL = "http://localhost:5001/api/upload";

const baseUrl = "http://34.57.202.249:5001";
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
      console.log("data", data);
  
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
    const storedUser = await SecureStore.getItemAsync("user");
    if (!storedUser) return;

    const parsedUser = JSON.parse(storedUser);
    const userId = parsedUser.id;

    // trim inputs for cleaner validation
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedZip = zip.trim();
    const trimmedOwner = owner.trim();

    // Validate each field
  if (!trimmedName) {
    Alert.alert("Missing Property Name", "Please enter a property name (e.g., '3 bed 2 bath').");
    return;
  }

  if (!trimmedAddress) {
    Alert.alert("Missing Address", "Please enter the property address.");
    return;
  }

  if (!trimmedCity) {
    Alert.alert("Missing City", "Please enter the city.");
    return;
  }

  if (!trimmedState) {
    Alert.alert("Missing State", "Please enter the state.");
    return;
  }

  if (!trimmedZip || !/^\d{5}$/.test(trimmedZip)) {
    Alert.alert("Invalid Zip Code", "Please enter a valid 5-digit zip code.");
    return;
  }

  if (!trimmedOwner) {
    Alert.alert("Missing Owner", "Please enter the owner's name.");
    return;
  }

    if (!address || !city || !state || !zip || !owner) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    let newLead = {
      name,
      address,
      city,
      state,
      zip,
      owner,
      images: images.length > 0 ? images : [],
      userId,
      notes,
    };
  
    try {
      let response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
  
      let data = await response.json();
      // console.log("🛬 Server response:", data);
  
      if (!response.ok) throw new Error("Failed to add property");
  
      Alert.alert("Success", "Property added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Error adding property:", error);
      Alert.alert("Error", "Failed to add property.");
    }
  };
  
  
  
  

  return (
    <SafeAreaView style={styles.safeContainer} >
    <View style={styles.container}>
      <View style={styles.photoButtonContainer}>
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
          <Text style={styles.photoButtonText}>Take a Picture</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
          <Text style={styles.photoButtonText}>Select from Gallery</Text>
        </TouchableOpacity>
      </View>


      {/* {image && <Image source={{ uri: image }} style={styles.imagePreview} />} */}

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
      <TextInput 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
        placeholder="Enter property name (e.g., 4 bed 4 bath)" 
      />

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter address" />

      <Text style={styles.label}>City</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Enter city" />

      <Text style={styles.label}>State</Text>
      <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="Enter state" />

      <Text style={styles.label}>Zip Code</Text>
      <TextInput style={styles.input} value={zip} onChangeText={setZip} placeholder="Enter zip code" keyboardType="numeric" />

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

      <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
        <Text style={styles.addButtonText}>Add Property</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1},
  container: { flex: 1, padding: 20 },
  // photoButton: { backgroundColor: "#A078C4", padding: 10, borderRadius: 5, marginBottom: 10, alignItems: "center" },
  photoButtonText: { color: "white", fontSize: 16 },
  imageScroll: { flexDirection: "row", marginBottom: 10 },
  imageContainer: { position: "relative", marginRight: 10 },
  imagePreview: { width: 100, height: 100, borderRadius: 10, marginBottom: 10 },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "white",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "lightgray",
  },
  removeButtonText: { color: "lightgray", fontSize: 18, fontWeight: "bold" },
  label: { fontSize: 16, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginTop: 5 },
  addButton: { marginTop: 20, backgroundColor: "#A078C4", padding: 15, borderRadius: 5, alignItems: "center" },
  addButtonText: { color: "white", fontSize: 16 },
  photoButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  photoButton: {
    flex: 1,
    backgroundColor: "#A078C4",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5, // Adds spacing between buttons
  },
});

export default AddPropertyScreen;
