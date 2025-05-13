import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const baseUrl = "http://34.31.159.135:5002/api/stats";
const chatbotUrl = "http://10.0.2.2:5001/api/chat";

const HomeScreen = (route) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const lastAppliedRef = useRef(null);
  const [stats, setStats] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatbotResponse, setChatbotResponse] = useState("");

  const fetchStats = async (userId) => {
    try {
      const response = await axios.get(`${baseUrl}/${userId}`);
      const data = response.data;
      setStats(data);
      await AsyncStorage.setItem("cachedStats", JSON.stringify(data));
    } catch (error) {
      Alert.alert("Error", "Failed to fetch stats from the backend");
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

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

  const handleAskGemini = async () => {
    if (!question.trim()) return;

    try {
      console.log("Sending question to Gemini:", question);
      const response = await axios.post(chatbotUrl, { question: question });
      console.log("Received response:", response.data);
      setChatbotResponse(response.data.response || "No response received.");
    } catch (err) {
      console.error("Error details:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.error || "Failed to get response from Gemini.");
    }
  };

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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user && <Text style={styles.welcomeText}>Hello, {user.given_name}</Text>}

        <View style={styles.grid}>
          <StatCard label="Total Leads" value={stats.totalLeads} iconName="target-outline" bgColor="#EDE9FE" iconColor="#7C3AED" />
          <StatCard label="Deals Closed" value={stats.dealsClosed} iconName="hand-left-outline" bgColor="#E0E7FF" iconColor="#4F46E5" />
          <StatCard label="Properties Contacted" value={stats.propertiesContacted} iconName="call-outline" bgColor="#E0F2FE" iconColor="#0284C7" />
          <StatCard label="Offers Made" value={stats.offersMade} iconName="business-outline" bgColor="#FEF3C7" iconColor="#D97706" />
          <StatCard label="Active Listings" value={stats.activeListings} iconName="home-outline" bgColor="#D1FAE5" iconColor="#059669" />
          <StatCard label="% Deals Closed" value={stats.percentageDealsClosed} iconName="stats-chart-outline" bgColor="#FFE4E6" iconColor="#E11D48" />
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("AddProperty")}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Add an Address</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Gemini Button */}
      <TouchableOpacity
        style={styles.geminiButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/gemini_logo.png')} 
            style={styles.geminiLogo}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ask Gemini a Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your question here"
              value={question}
              onChangeText={setQuestion}
              multiline
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAskGemini}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
            {chatbotResponse !== "" && (
              <View style={styles.responseBox}>
                <Text style={styles.responseText}>{chatbotResponse}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ color: "#7C3AED", marginTop: 12 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: "#1F2937",
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
    color: "#1F2937",
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
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    height: 80,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    textAlignVertical: "top",
  },
  modalButton: {
    backgroundColor: "#7C3AED",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  responseBox: {
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
  },
  responseText: {
    fontSize: 14,
    color: "#111827",
  },
  geminiButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  geminiLogo: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
});

export default HomeScreen;
