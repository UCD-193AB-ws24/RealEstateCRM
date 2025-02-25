import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = () => {
  const navigation = useNavigation();

  // State to hold the stats fetched from the backend
  const [stats, setStats] = useState({
    totalLeads: 0,
    dealsClosed: 0,
    propertiesContacted: 0,
    offersMade: 0,
    activeListings: 0,
    percentageDealsClosed: 0,
  });

  // Function to fetch stats from the backend
  const fetchStats = async () => {
    try {
      const response = await fetch("http://10.0.2.2:5001/api/stats"); // Replace with your API URL
      const data = await response.json();
      setStats(data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch stats from the backend");
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch stats whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container}>
        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalLeads}</Text>
              <Text style={styles.statLabel}>Total Leads</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.dealsClosed}</Text>
              <Text style={styles.statLabel}>Deals Closed</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.propertiesContacted}</Text>
              <Text style={styles.statLabel}>Properties Contacted</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.offersMade}</Text>
              <Text style={styles.statLabel}>Offers Made</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.activeListings}</Text>
              <Text style={styles.statLabel}>Active Listings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.percentageDealsClosed}</Text>
              <Text style={styles.statLabel}>% Deals Closed</Text>
            </View>
          </View>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("AddProperty")}>
            <Ionicons name="add-circle-outline" size={24} color="black" />
            <Text style={styles.buttonText}>Add an Address</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#DFC5FE",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#DFC5FE",
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statBox: {
    width: "45%", // Makes each stat box take up 45% of the screen width
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A078C4",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
  },
  actionButton: {
    width: "80%",
    backgroundColor: "#A078C4",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});

export default HomeScreen;
