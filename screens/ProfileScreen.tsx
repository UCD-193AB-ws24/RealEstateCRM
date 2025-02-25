import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Import expo-image-picker
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("johndoe@example.com");
  const [phone, setPhone] = useState("(123) 456-7890");
  const [address, setAddress] = useState("123 Main St, Cityville");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState(null); // To track which field is being edited

  const navigation = useNavigation();

  // Function to navigate to the settings screen
  const goToSettings = () => {
    navigation.navigate("Settings");
  };

  // Function to handle image selection from gallery
  const pickImage = async () => {
    // Ask for permission to access gallery
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied", "You need to grant permission to access the gallery.");
      return;
    }

    // Launch the image picker to select a photo
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.uri); // Set the selected image URI
    }
  };

  // Handle saving changes
  const handleSaveChanges = () => {
    setIsEditing(false);
    setEditField(null);
    // You can add further logic here to save the changes to a backend or global state.
  };

  // Toggle edit mode for specific field
  const handleEditField = (field) => {
    setIsEditing(true);
    setEditField(field);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Icon */}
      <TouchableOpacity onPress={pickImage} style={styles.profileIconContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.profileIcon} />
        ) : (
          <Ionicons name="person-circle" size={120} color="#A078C4" />
        )}
      </TouchableOpacity>

      {/* User Information */}
      <Text style={styles.title}>User Profile</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.userInfoLabel}>Name:</Text>
        {editField === "name" ? (
          <TextInput
            style={styles.inputField}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        ) : (
          <Text style={styles.userInfoValue}>{name}</Text>
        )}
        <TouchableOpacity onPress={() => handleEditField("name")} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#A078C4" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.userInfoLabel}>Email:</Text>
        {editField === "email" ? (
          <TextInput
            style={styles.inputField}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoFocus
          />
        ) : (
          <Text style={styles.userInfoValue}>{email}</Text>
        )}
        <TouchableOpacity onPress={() => handleEditField("email")} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#A078C4" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.userInfoLabel}>Phone:</Text>
        {editField === "phone" ? (
          <TextInput
            style={styles.inputField}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
          />
        ) : (
          <Text style={styles.userInfoValue}>{phone}</Text>
        )}
        <TouchableOpacity onPress={() => handleEditField("phone")} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#A078C4" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.userInfoLabel}>Address:</Text>
        {editField === "address" ? (
          <TextInput
            style={styles.inputField}
            value={address}
            onChangeText={setAddress}
            autoFocus
          />
        ) : (
          <Text style={styles.userInfoValue}>{address}</Text>
        )}
        <TouchableOpacity onPress={() => handleEditField("address")} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#A078C4" />
        </TouchableOpacity>
      </View>

      {/* Settings Button */}
      <TouchableOpacity style={styles.settingsButton} onPress={goToSettings}>
        <Ionicons name="settings" size={30} color="#A078C4" />
      </TouchableOpacity>

      {/* Save Changes Button */}
      {isEditing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#DFC5FE",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  profileIconContainer: {
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 60,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#A078C4",
  },
  infoContainer: {
    marginBottom: 20,
    alignSelf: "stretch",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  userInfoLabel: {
    fontSize: 18,
    color: "#A078C4",
    fontWeight: "600",
    width: "30%",
  },
  userInfoValue: {
    fontSize: 20,
    color: "#333",
    fontWeight: "500",
    marginTop: 5,
    width: "60%",
  },
  inputField: {
    fontSize: 20,
    color: "#333",
    fontWeight: "500",
    marginTop: 5,
    width: "60%",
    borderBottomWidth: 1,
    borderColor: "#A078C4",
    paddingBottom: 5,
  },
  editButton: {
    marginLeft: 10,
  },
  settingsButton: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: "#A078C4",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    width: "80%",
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
