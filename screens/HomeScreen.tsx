import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseUrl = "http://34.31.159.135:5002/api/stats";

const HomeScreen = (route) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const lastAppliedRef = useRef(null);

  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  const fetchStats = async (userId) => {
    try {
      const response = await axios.get(`${baseUrl}/${userId}`);
      const data = response.data;
      setStats(data);
      await AsyncStorage.setItem("cachedStats", JSON.stringify(data)); // 🆕
    } catch (error) {
      Alert.alert("Error", "Failed to fetch stats from the backend");
      console.error("Error fetching stats:", error);
    }
  };
  

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        const storedUser = await SecureStore.getItemAsync("user");
        if (!storedUser) return;
  
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
  
        const routeParams = route?.params;
  
        if (routeParams?.optimisticStats) {
          const cached = await AsyncStorage.getItem("cachedStats");
          const existingStats = cached ? JSON.parse(cached) : {};
          const mergedStats = {
            ...existingStats,
            ...Object.fromEntries(
              Object.entries(routeParams.optimisticStats).map(([key, delta]) => [
                key,
                Math.max((existingStats[key] || 0) + delta, 0),
              ])
            ),
          };
          setStats(mergedStats);
          await AsyncStorage.setItem("cachedStats", JSON.stringify(mergedStats));
          navigation.setParams({ optimisticStats: null }); // clear
          return;
        }
  
        const cachedStats = await AsyncStorage.getItem("cachedStats");
        if (cachedStats) {
          setStats(JSON.parse(cachedStats));
        }
      };
  
      loadStats();
    }, [route.params])
  );
  
  
  
  
  
  
  

  const StatCard = ({ label, value, iconName, bgColor, iconColor }) => (
    <View style={styles.statCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={16} color={iconColor} />
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );

  if (!stats) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#7C3AED", fontSize: 16 }}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // ✅ Now safe to use stats.totalLeads
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && <Text style={styles.welcomeText}>Hello, {user.given_name}</Text>}
  
        <View style={styles.grid}>
          <StatCard
            label="Total Leads"
            value={stats.totalLeads}
            iconName="target-outline"
            bgColor="#EDE9FE"
            iconColor="#7C3AED"
          />
          <StatCard
            label="Deals Closed"
            value={stats.dealsClosed}
            iconName="hand-left-outline"
            bgColor="#E0E7FF"
            iconColor="#4F46E5"
          />
          <StatCard
            label="Properties Contacted"
            value={stats.propertiesContacted}
            iconName="call-outline"
            bgColor="#E0F2FE"
            iconColor="#0284C7"
          />
          <StatCard
            label="Offers Made"
            value={stats.offersMade}
            iconName="business-outline"
            bgColor="#FEF3C7"
            iconColor="#D97706"
          />
          <StatCard
            label="Active Listings"
            value={stats.activeListings}
            iconName="home-outline"
            bgColor="#D1FAE5"
            iconColor="#059669"
          />
          <StatCard
            label="% Deals Closed"
            value={stats.percentageDealsClosed}
            iconName="stats-chart-outline"
            bgColor="#FFE4E6"
            iconColor="#E11D48"
          />
        </View>
  
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("AddProperty")}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Add an Address</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
  
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#1F2937", // slate-900
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    marginTop: 32,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937", // slate-900
  },
  iconWrapper: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB", // gray-200
    marginVertical: 12,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
  },  
});

export default HomeScreen;
