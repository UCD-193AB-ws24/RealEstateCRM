import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Dimensions, Modal } from "react-native";
import { Card, Button } from "react-native-paper";
import Carousel from "react-native-snap-carousel-v4";
import DropDownPicker from "react-native-dropdown-picker";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "react-native-feather"; // Import Feather icons
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import LeadListScreen from "./LeadListScreen";

const API_URL = "http://34.31.159.135:5001/api/leads";
const IMAGE_UPLOAD_URL = "http://34.31.159.135:5001/api/upload";

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
      if (!editableLead.id) return; // skip if lead was deleted
      if (hasChangesRef.current) await saveLead();
    });
  }, []);

  const handleInputChange = (field, value) => {
    setEditableLead({ ...editableLead, [field]: value });
    setHasChanges(true);
  };

  const saveLead = async () => {
    try {
      const updatedLead = { ...editableLead, status, notes: editableLead.notes || "" };

      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLead),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update lead: ${errorText}`);
      }

      setHasChanges(false);
      navigation.navigate("Leads");
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
      setModalVisible(false);
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
      navigation.navigate("Leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
      Alert.alert("Error", "Failed to delete lead");
    }
  };

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
      selectionLimit: 5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Images = result.assets.map((asset) => {
        const mimeType = asset.type || "image/jpeg";
        return `data:${mimeType};base64,${asset.base64}`;
      });

      const updatedImages = [...(editableLead.images || []), ...base64Images];
      const updatedLead = { ...editableLead, images: updatedImages };

      setEditableLead(updatedLead);
      setHasChanges(true);
    }
  };

  const confirmDeleteLead = () => {
    Alert.alert(
      "Delete Lead?",
      "Are you sure you want to delete this lead?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteLead },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={30} color="black" />
          </TouchableOpacity>

          <Text style={styles.addressText}>
            {editableLead.name ? editableLead.name : editableLead.address.split(",")[0]}
          </Text>

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Feather name="edit" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.trashButton} onPress={confirmDeleteLead}>
            <Feather name="trash" size={30} color="black" />
          </TouchableOpacity>
        </View>

        {/* Image Carousel with Arrows */}
        <View style={styles.carouselContainer}>
          {editableLead.images.length > 0 ? (
            <>
              {activeSlide > 0 && (
                <TouchableOpacity style={styles.arrowLeft} onPress={() => carouselRef.current?.snapToPrev()}>
                  <Feather name="chevron-left" size={30} color="white" />
                </TouchableOpacity>
              )}

              <Carousel
                ref={carouselRef}
                data={[...editableLead.images, "add-new"]}
                renderItem={({ item }) =>
                  item === "add-new" ? (
                    <TouchableOpacity style={styles.addImageContainer} onPress={addImage}>
                      <Feather name="plus-circle" size={70} color="#A078C4" />
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
                  <Feather name="chevron-right" size={30} color="white" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Feather name="image" size={80} color="gray" />
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
            placeholder="Select Status"
            zIndex={1000}
            zIndexInverse={3000}
          />
        </View>

        {/* Lead Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={editableLead.notes}
            onChangeText={(text) => handleInputChange("notes", text)}
            placeholder="Enter notes about this lead..."
          />
        </View>
      </ScrollView>

      {/* Save Changes Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Save Changes?</Text>
            <View style={styles.modalButtonContainer}>
              <Button mode="outlined" onPress={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button mode="contained" onPress={saveChanges}>
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    marginLeft: 10,
  },
  addressText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  trashButton: {
    marginRight: 10,
  },
  carouselContainer: {
    marginVertical: 20,
    alignItems: "center",
  },
  arrowLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    zIndex: 1,
  },
  arrowRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    zIndex: 1,
  },
  imageWrapper: {
    marginBottom: 10,
  },
  leadImage: {
    width: screenWidth - 40,
    height: 200,
    borderRadius: 8,
  },
  addImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 15,
    padding: 5,
  },
  removeButtonText: {
    color: "white",
    fontSize: 18,
  },
  noImageContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  noImageText: {
    color: "gray",
    fontSize: 18,
    marginTop: 10,
  },
  pickerContainer: {
    marginVertical: 10,
  },
  dropdown: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
  },
  notesContainer: {
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    height: 100,
    textAlignVertical: "top",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
