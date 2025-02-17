import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

const API_URL = "http://localhost:5001/api/leads";
const IMAGE_UPLOAD_URL = "http://localhost:5001/api/upload";


const AddPropertyScreen = () => {
  const navigation = useNavigation();

  const [image, setImage] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [owner, setOwner] = useState("");

  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        exif: true,  // get image metadata
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
        exif: true,
      });
    }

    if (!result.cancelled) {
      setImage(result.uri);
      if (result.exif && result.exif.GPSLatitude && result.exif.GPSLongitude) {
        getAddressFromCoords(result.exif.GPSLatitude, result.exif.GPSLongitude);
      } else {
        Alert.alert("No GPS Data", "Location data not found in image metadata.");
      }
    }
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    let location = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (location.length > 0) {
      setAddress(location[0].street || "");
      setCity(location[0].city || "");
      setState(location[0].region || "");
      setZip(location[0].postalCode || "");
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

    try {
      let imageUrl = null;
  
      if (image) {
        // Upload the image and create lead in one request
        imageUrl = await uploadImage(image, address, city, state, zip, owner);
        if (!imageUrl) {
          throw new Error("Image upload failed.");
        }
        // If image upload works, lead is already added, so return early
        Alert.alert("Success", "Property added successfully!");
        navigation.goBack();
        return;
      }
  
      // If no image, create the lead via /api/leads
      const newProperty = { address, city, state, zip, owner };
  
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProperty),
      });
  
      if (!response.ok) throw new Error("Failed to add property");
  
      Alert.alert("Success", "Property added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding property:", error);
      Alert.alert("Error", "Failed to add property.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(true)}>
        <Text style={styles.photoButtonText}>Take a Picture</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(false)}>
        <Text style={styles.photoButtonText}>Use Photo Gallery</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  photoButton: { backgroundColor: "#A078C4", padding: 10, borderRadius: 5, marginBottom: 10, alignItems: "center" },
  photoButtonText: { color: "white", fontSize: 16 },
  imagePreview: { width: "100%", height: 200, borderRadius: 10, marginBottom: 10 },
  label: { fontSize: 16, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginTop: 5 },
  addButton: { marginTop: 20, backgroundColor: "#A078C4", padding: 15, borderRadius: 5, alignItems: "center" },
  addButtonText: { color: "white", fontSize: 16 },
});

export default AddPropertyScreen;
