import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://localhost:5001/api/leads";
const IMAGE_UPLOAD_URL = "http://localhost:5001/api/upload";


const AddPropertyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { latitude, longitude } = route.params || {};

  const isFromMap = !!latitude && !!longitude;

  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [firstImageUri, setFirstImageUri] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    if (isFromMap) {
      getAddressFromCoords(latitude, longitude);
    }
  }, [latitude, longitude]);

  const pickImage = async (useCamera = false) => {
    let result;

    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        quality: 1,
        exif: true,  // get image metadata
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 1,
        exif: true,
      });
    }

    if (!result.canceled) {
      const newImages = result.assets ? result.assets.map(img => img.uri) : [result.uri];
      setImages([...images, ...newImages]);

      // Use first image's metadata for autofill if no previous autofill
      if (!isFromMap && !firstImageUri && result.assets && result.assets.length > 0) {
        setFirstImageUri(result.assets[0].uri);
        const { GPSLatitude, GPSLongitude } = result.assets[0].exif || {};
        if (GPSLatitude && GPSLongitude) {
          getAddressFromCoords(GPSLatitude, GPSLongitude);
        }
      }
    }
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      let location = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (location.length > 0) {
        setAddress(location[0].street || "");
        setCity(location[0].city || "");
        setState(location[0].region || "");
        setZip(location[0].postalCode || "");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
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
  
    // ✅ FIX: Explicitly append text fields
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
      console.log("server response:", data);

      if (!response.ok) throw new Error("Upload failed: " + JSON.stringify(data));
  
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };
  

  // Function to add property to database
  const handleAddProperty = async () => {
    if (!address || !city || !state || !zip || !owner) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
  
    let imageUrls = [];
  
    if (images.length > 0) {
      let formData = new FormData();
      images.forEach((imgUri, index) => {
        formData.append("files", {
          uri: imgUri.startsWith("file://") ? imgUri : `file://${imgUri}`,
          name: `property-${index}.jpg`,
          type: "image/jpeg",
        });
      });
  
      formData.append("address", address);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("zip", zip);
      formData.append("owner", owner);
  
      try {
        let response = await fetch(IMAGE_UPLOAD_URL, {
          method: "POST",
          body: formData,
          headers: { "Accept": "application/json" },
        });
  
        let data = await response.json();
        if (!response.ok) throw new Error("Upload failed: " + JSON.stringify(data));
  
        console.log("✅ Lead added via /api/upload", data);
        Alert.alert("Success", "Property added successfully!");
        navigation.goBack();
        return; // 🚀 Prevents duplicate call to /api/leads
      } catch (error) {
        console.error("Error uploading images:", error);
        Alert.alert("Error", "Failed to upload images.");
        return;
      }
    }
  
    // If no images, add lead separately
    const newProperty = { name, address, city, state, zip, owner };
  
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProperty),
      });
  
      if (!response.ok) throw new Error("Failed to add property");
  
      console.log("✅ Lead added via /api/leads", await response.json());
      Alert.alert("Success", "Property added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding property:", error);
      Alert.alert("Error", "Failed to add property.");
    }
  };
  

  return (
    <SafeAreaView style={styles.safeContainer} >
    <View style={styles.container}>
      <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
        <Text style={styles.photoButtonText}>Take a Picture</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
        <Text style={styles.photoButtonText}>Select from Gallery</Text>
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
        <Text style={styles.addButtonText}>Add Property</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1},
  container: { flex: 1, padding: 20 },
  photoButton: { backgroundColor: "#A078C4", padding: 10, borderRadius: 5, marginBottom: 10, alignItems: "center" },
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
});

export default AddPropertyScreen;
