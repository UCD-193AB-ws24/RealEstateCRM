import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Dimensions, Modal } from "react-native";
import { Card, Button } from "react-native-paper";
import Carousel from "react-native-snap-carousel";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { ViewPropTypes } from "deprecated-react-native-prop-types";


const API_URL = "http://localhost:5001/api/leads"; // Ensure this matches your backend

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


  useEffect(() => {
    return navigation.addListener("beforeRemove", async () => {
      if (hasChanges) await saveLead();
    });
  }, [editableLead]);

  const handleInputChange = (field, value) => {
    setEditableLead({ ...editableLead, [field]: value });
    setHasChanges(true);
  };

  const saveLead = async () => {
    try {
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableLead),
      });

      if (!response.ok) throw new Error("Failed to update lead");

      setModalVisible(false);

    } catch (error) {
      console.error("Error updating lead:", error);
      Alert.alert("Error", "Failed to update lead");
    }
  };

  // Function to delete lead
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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={30} color="black" />
      </TouchableOpacity>

      {/* Address & Edit Button */}
      <View style={styles.header}>
        <Text style={styles.addressText}>{editableLead.address.split(",")[0]}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="pencil" size={24} color="black" />
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
              data={editableLead.images}
              renderItem={({ item }) => <Image source={{ uri: item }} style={styles.leadImage} />}
              sliderWidth={screenWidth - 40}
              itemWidth={screenWidth - 40}
              onSnapToItem={(index) => setActiveSlide(index)}
            />

            {activeSlide < editableLead.images.length - 1 && (
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
          items={items}
          setOpen={setOpen}
          setValue={setStatus}
          onChangeValue={(value) => {
            handleInputChange("status", value);
            setStatus(value);
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

      <TouchableOpacity style={styles.deleteButton} onPress={deleteLead}>
        <Text style={styles.buttonText}>Delete Lead</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {["address", "city", "state", "zip", "owner"].map((field) => (
              <View key={field} style={styles.modalField}>
                <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  value={editableLead[field]}
                  onChangeText={(text) => handleInputChange(field, text)}
                />
              </View>
            ))}
            <Button mode="contained" onPress={saveLead} style={styles.saveButton}>
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
  header: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  addressText: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginRight: 10 },
  carouselContainer: { alignItems: "center", marginVertical: 20 },
  leadImage: { width: "100%", height: 250, borderRadius: 10 },
  arrowLeft: { position: "absolute", left: 10, top: "50%", zIndex: 1 },
  arrowRight: { position: "absolute", right: 10, top: "50%", zIndex: 1 },
  statusContainer: { marginTop: 20 },
  statusTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  statusInput: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, backgroundColor: "#fff" },
  pickerContainer: { marginVertical: 10 },
  notesContainer: { marginTop: 20 },
  dropdown: { borderColor: "#ccc", backgroundColor: "#fff", width: "100%" },
  dropdownContainer: { borderColor: "#ccc", width: "100%" },
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
});
