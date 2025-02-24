import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Dimensions, Modal } from "react-native";
import { Card, Button } from "react-native-paper";
import Carousel from "react-native-snap-carousel";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { ViewPropTypes } from "deprecated-react-native-prop-types";
import LeadListScreen from "./LeadListScreen";


const API_URL = "http://localhost:5001/api/leads";
const IMAGE_UPLOAD_URL = "http://localhost:5001/api/upload";

export default function LeadDetailScreen({ route, navigation }) {
  const { lead } = route.params;
  const [editableLead, setEditableLead] = useState({ ...lead });
  const [hasChanges, setHasChanges] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const carouselRef = useRef(null);
  const screenWidth = Dimensions.get("window").width;
  const [activeSlide, setActiveSlide] = useState(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(editableLead.status || "Lead");
  const [items, setItems] = useState([
    { label: "Lead", value: "Lead" },
    { label: "Contact", value: "Contact" },
    { label: "Offer", value: "Offer" },
    { label: "Sale", value: "Sale" },
  ]);

  const hasChangesRef = useRef(false);


  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);
  
  useEffect(() => {
    return navigation.addListener("beforeRemove", async () => {
      if (hasChangesRef.current) await saveLead();
    });
  }, []);

  const handleInputChange = (field, value) => {
    setEditableLead({ ...editableLead, [field]: value });
    setHasChanges(true);
  };

  const saveLead = async () => {
  try {
    const updatedLead = { ...editableLead, status }; // Ensure status is updated

    console.log("Updating lead with data:", updatedLead); // Debugging log

    const response = await fetch(`${API_URL}/${lead.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedLead), // ✅ Send entire lead object
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update lead: ${errorText}`);
    }

    setHasChanges(false);
    navigation.navigate("LeadListScreen"); // ✅ Navigate to list view

  } catch (error) {
    console.error("Error updating lead:", error);
    Alert.alert("Error", `Failed to update lead: ${error.message}`);
  }
};

  

  const saveChanges = async () => {
    try {
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableLead),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update lead: ${errorText}`);
      }
  
      const updatedLead = await response.json();
      setEditableLead(updatedLead);
      setHasChanges(false);
      setModalVisible(false); // ✅ Closes modal but stays on details screen
  
    } catch (error) {
      console.error("Error updating lead:", error);
      Alert.alert("Error", `Failed to update lead: ${error.message}`);
    }
  };
  
  

  const deleteLead = async () => {
    try {
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete lead");

      Alert.alert("Success", "Lead deleted successfully!");
      navigation.goBack(); // Navigate back to the lead list after deletion
    } catch (error) {
      console.error("Error deleting lead:", error);
      Alert.alert("Error", "Failed to delete lead");
    }
  };

  // Function to delete lead
  const deleteImage = async (imageUrl) => {
    const updatedImages = editableLead.images.filter((img) => img !== imageUrl);
    setEditableLead({ ...editableLead, images: updatedImages });
    setHasChanges(true);

    try {
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editableLead, images: updatedImages }),
      });

      if (!response.ok) throw new Error("Failed to delete image");
    } catch (error) {
      console.error("Error deleting image:", error);
      Alert.alert("Error", "Failed to delete image.");
    }
  };

  const addImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      selectionLimit: 5, // Allow selecting multiple images
    });
  
    if (!result.canceled) {
      let formData = new FormData();
      result.assets.forEach((asset, index) => {
        formData.append("file", {
          uri: asset.uri,
          name: `image-${index}.jpg`,
          type: "image/jpeg",
        });
      });
  
      try {
        let response = await fetch(IMAGE_UPLOAD_URL, {
          method: "POST",
          body: formData,
          headers: { "Accept": "application/json" }, // ✅ Ensure JSON response
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${errorText}`);
        }
  
        let data = await response.json(); // ✅ Parse JSON
        const updatedImages = [...editableLead.images, ...data.imageUrls];
  
        setEditableLead({ ...editableLead, images: updatedImages });
        setHasChanges(true);
  
        // ✅ Update lead in DB
        await fetch(`${API_URL}/${lead.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editableLead, images: updatedImages }),
        });
  
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Error", `Failed to upload image: ${error.message}`);
      }
    }
  };



  const confirmDeleteLead = () => {
    Alert.alert(
      "Delete Lead?",
      "Are you sure you want to delete this lead?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteLead }
      ]
    );
  };
  
  
  

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="black" />
        </TouchableOpacity>

        <Text style={styles.addressText}>
          {editableLead.name ? editableLead.name : editableLead.address.split(",")[0]}
        </Text>


        <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="pencil" size={24} color="black" />
          </TouchableOpacity>
        <TouchableOpacity style={styles.trashButton} onPress={confirmDeleteLead}>
          <Ionicons name="trash" size={30} color="black" />
        </TouchableOpacity>
      </View>


      {/* Image Carousel with Arrows */}
      <View style={styles.carouselContainer}>
        {editableLead.images.length > 0 ? (
          <>
            {activeSlide > 0 && (
              <TouchableOpacity style={styles.arrowLeft} onPress={() => carouselRef.current?.snapToPrev()}>
                <Ionicons name="chevron-back" size={30} color="white" />
              </TouchableOpacity>
            )}

          <Carousel
            ref={carouselRef}
            data={[...editableLead.images, "add-new"]}
            renderItem={({ item }) =>
              item === "add-new" ? (
                <TouchableOpacity style={styles.addImageContainer} onPress={addImage}>
                  <Ionicons name="add-circle" size={70} color="#A078C4" />
                </TouchableOpacity>
              ) : (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: item }} style={styles.leadImage} />
                  <TouchableOpacity style={styles.removeButton} onPress={() => deleteImage(item)}>
                    <Text style={styles.removeButtonText}>x</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            sliderWidth={screenWidth - 40}
            itemWidth={screenWidth - 40}
            onSnapToItem={(index) => setActiveSlide(index)}
          />

            {activeSlide < editableLead.images.length && (
              <TouchableOpacity style={styles.arrowRight} onPress={() => carouselRef.current?.snapToNext()}>
                <Ionicons name="chevron-forward" size={30} color="white" />
              </TouchableOpacity>
            )}

          </>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={80} color="gray" />
            <Text style={styles.noImageText}>No Images Available</Text>
          </View>
        )}
      </View>

      {/* Status Tracker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.notesTitle}>Status</Text>
        <DropDownPicker
          open={open}
          value={status}
          items={[
            { label: "Lead", value: "Lead" },
            { label: "Contact", value: "Contact" },
            { label: "Offer", value: "Offer" },
            { label: "Sale", value: "Sale" },
          ]}
          setOpen={setOpen}
          setValue={(value) => {
            if (value !== status) {
              handleInputChange("status", value);
              setStatus(value);
            }
          }}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
        />
      </View>

      {/* Notes Section */}
      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={editableLead.notes || ""}
          onChangeText={(text) => handleInputChange("notes", text)}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={saveLead}>
        <Text style={styles.buttonText}>Save Lead</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {["name", "address", "city", "state", "zip", "owner"].map((field) => (
              <View key={field} style={styles.modalField}>
                <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  value={editableLead[field]}
                  onChangeText={(text) => handleInputChange(field, text)}
                />
              </View>
            ))}
            <Button mode="contained" onPress={saveChanges} style={styles.saveButton}>
              Save
            </Button>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#DFC5FE" },
  scrollContainer: { padding: 15 },
  backButton: { marginTop: 10, marginLeft: 10 },
  headerIcons: { flexDirection: "row", },
  trashIcon: { paddingRight: 10 },
  addImageContainer: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DFC5FE",
    borderRadius: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // ✅ Ensures proper alignment
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  header: { flexDirection: "row", justifyContent: "center", alignItems: "center", },
  addressText: { fontSize: 22, fontWeight: "bold", textAlign: "center", },
  carouselContainer: { alignItems: "center", marginVertical: 20 },
  leadImage: { width: "100%", height: 250, borderRadius: 10 },
  arrowLeft: { position: "absolute", left: 10, top: "50%", zIndex: 1 },
  arrowRight: { position: "absolute", right: 10, top: "50%", zIndex: 1 },
  statusContainer: { marginTop: 20 },
  statusTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  statusInput: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, backgroundColor: "#fff" },
  pickerContainer: { marginVertical: 10, zIndex: 1000, },
  notesContainer: { marginTop: 20 },
  dropdown: { borderColor: "#ccc", backgroundColor: "#fff", width: "100%", zIndex: 2000, },
  dropdownContainer: { borderColor: "#ccc", width: "100%", zIndex: 3000, },
  notesTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  notesInput: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, height: 100 },
  deleteButton: { backgroundColor: "#A078C4", padding: 15, borderRadius: 5, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  modalField: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5 },
  saveButton: { backgroundColor: "#7B5BA6", marginTop: 10 },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
