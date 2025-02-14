import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Card, Button } from "react-native-paper";

const API_URL = "http://localhost:5001/api/leads"; // Ensure this matches your backend

export default function LeadDetailScreen({ route, navigation }) {
  const { lead } = route.params;

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
    <View style={styles.container}>
      <Card>
        <Card.Content>
          <Text style={styles.address}>{lead.address}</Text>
          <Text>City: {lead.city}</Text>
          <Text>State: {lead.state}</Text>
          <Text>Zip: {lead.zip}</Text>
          <Text>Owner: {lead.owner}</Text>
        </Card.Content>
      </Card>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={deleteLead}>
        <Text style={styles.deleteButtonText}>Delete Lead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  address: { fontSize: 20, fontWeight: "bold" },
  deleteButton: {
    backgroundColor: "#A078C4",
    padding: 15,
    marginTop: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
