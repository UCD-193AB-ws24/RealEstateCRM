import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

const API_URL = "http://localhost:5001/api/leads";


const AddPropertyScreen = () => {
  const navigation = useNavigation();

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [owner, setOwner] = useState("");

  // Function to add property to database
  const handleAddProperty = async () => {
    if (!address || !city || !state || !zip || !owner) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const newProperty = {
      address,
      city,
      state,
      zip,
      owner,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProperty),
      });

      if (!response.ok) throw new Error("Failed to add property");

      Alert.alert("Success", "Property added successfully!");
      navigation.goBack(); // Navigate back to Lead List Screen
    } catch (error) {
      console.error("Error adding property:", error);
      Alert.alert("Error", "Failed to add property.");
    }
  };

  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: "#A078C4",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default AddPropertyScreen;
