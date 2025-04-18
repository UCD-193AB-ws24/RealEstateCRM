import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { Card, Button } from "react-native-paper";
import Carousel from "react-native-snap-carousel";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import LeadListScreen from "./LeadListScreen";

const API_URL = "http://34.57.202.249:5001/api/leads";
const IMAGE_UPLOAD_URL = "http://34.57.202.249:5001/api/upload";

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
      const updatedLead = {
        ...editableLead,
        status,
        notes: editableLead.notes || "",
      };

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
      navigation.goBack();
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
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${errorText}`);
        }

        let data = await response.json();
        const updatedImages = [...editableLead.images, ...data.imageUrls];

        setEditableLead({ ...editableLead, images: updatedImages });
        setHasChanges(true);

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
    Alert.alert("Delete Lead?", "Are you sure you want to delete this lead?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteLead },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>{"<"}</Text>
          </TouchableOpacity>

          <Text style={styles.addressText}>
            {editableLead.name
              ? editableLead.name
              : editableLead.address.split(",")[0]}
          </Text>

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.iconText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trashButton} onPress={confirmDeleteLead}>
            <Text style={styles.iconText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.carouselContainer}>
          {editableLead.images.length > 0 ? (
            <>
              {activeSlide > 0 && (
                <TouchableOpacity
                  style={styles.arrowLeft}
                  onPress={() => carouselRef.current?.snapToPrev()}
                >
                  <Text style={styles.arrowText}>{"<"}</Text>
                </TouchableOpacity>
              )}

              <Carousel
                ref={carouselRef}
                data={[...editableLead.images, "add-new"]}
                renderItem={({ item }) =>
                  item === "add-new" ? (
                    <TouchableOpacity
                      style={styles.addImageContainer}
                      onPress={addImage}
                    >
                      <Text style={styles.plusText}>+</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: item }} style={styles.leadImage} />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => deleteImage(item)}
                      >
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
                <TouchableOpacity
                  style={styles.arrowRight}
                  onPress={() => carouselRef.current?.snapToNext()}
                >
                  <Text style={styles.arrowText}>{">"}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={{ fontSize: 60 }}>🖼️</Text>
              <Text style={styles.noImageText}>No Images Available</Text>
            </View>
          )}
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.notesTitle}>Status</Text>
          <DropDownPicker
            open={open}
            value={status}
            items={items}
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
                  <Text style={styles.label}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Text>
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
  // Add or keep your existing styles here
  iconText: { fontSize: 24, marginHorizontal: 8 },
  arrowText: { fontSize: 30, color: "white" },
  plusText: { fontSize: 50, color: "#A078C4" },
  // your other styles...
});
