import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Switch, Alert } from "react-native";
import { Card, Button } from "react-native-paper";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

const API_URL = "http://10.0.2.2:5001/api/leads"; // Adjust if using an emulator

export default function LeadListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapView, setIsMapView] = useState(false);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchLeads();
    });
  
    return unsubscribe;
  }, [navigation]);
  

  // Fetch leads from the database
  const fetchLeads = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  // Add a new lead to the database
  const addLead = async () => {
    const newLead = {
      address: "555 New Ave",
      city: "Davis",
      state: "CA",
      zip: "95616",
      owner: "NEW OWNER",
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });

      if (!response.ok) throw new Error("Failed to add lead");

      const addedLead = await response.json();
      setLeads((prevLeads) => [...prevLeads, addedLead]);
      Alert.alert("Success", "Lead added successfully!");
    } catch (error) {
      console.error("Error adding lead:", error);
      Alert.alert("Error", "Failed to add lead");
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar with Toggle */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="black" style={styles.searchIcon} />
        <TextInput
          placeholder="Search Leads..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.toggleText}>{isMapView ? "Map" : "List"}</Text>
        <Switch value={isMapView} onValueChange={() => setIsMapView(!isMapView)} />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button mode="contained" style={styles.button}>Filters</Button>
        <Button mode="contained" style={styles.button}>Actions</Button>
        <Button mode="contained" style={styles.addButton} onPress={addLead}>+ Add</Button>
        <Button mode="contained" style={styles.button}>Export</Button>
      </View>

      {/* List of Leads */}
      {!isMapView && (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate("LeadDetails", { lead: item })}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.address}>{item.address}</Text>
                  <Text>{item.city}, {item.state} {item.zip}</Text>
                  <Text>Owner: {item.owner}</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {isMapView && (
        <View style={styles.mapPlaceholder}>
          <Text style={{ fontSize: 18 }}>🗺️ Map View Placeholder</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#DFC5FE" },
  searchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10, backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  toggleText: { fontSize: 14, marginRight: 5, fontWeight: "bold" },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  button: { backgroundColor: "#A078C4", borderRadius: 5, maxWidth: 100, height: 40 },
  addButton: { backgroundColor: "#A078C4", paddingHorizontal: 5, borderRadius: 5, maxWidth: 100, height: 40 },
  card: { marginBottom: 10, padding: 10, backgroundColor: "#fff" },
  address: { fontSize: 16, fontWeight: "bold" },
  mapPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEE", borderRadius: 10 },
});

