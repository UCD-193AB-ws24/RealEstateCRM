import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { usePropertyContext } from "../contexts/PropertyContext"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"  // Import icons

const HomeScreen = () => {
  const navigation = useNavigation()
  const { sortProperties } = usePropertyContext()

  return (
    <View style={styles.container}>
      {/* Quick Stats Section */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>50</Text>
            <Text style={styles.statLabel}>Total Leads</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>10</Text>
            <Text style={styles.statLabel}>Deals Closed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>30</Text>
            <Text style={styles.statLabel}>Properties Contacted</Text>
          </View>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("LeadList")}>
          <Ionicons name="list" size={24} color="black" />
          <Text style={styles.buttonText}>View Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("AddProperty")}>
          <Ionicons name="add-circle-outline" size={24} color="black" />
          <Text style={styles.buttonText}>Add an Address</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CameraScreen")}>
          <MaterialIcons name="camera-alt" size={24} color="black" />
          <Text style={styles.buttonText}>Take a Picture</Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("GalleryScreen")}>
          <MaterialIcons name="photo-library" size={24} color="black" />
          <Text style={styles.buttonText}>Use Photo Gallery</Text>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Map")}> 
          <FontAwesome5 name="car" size={24} color="black" />
          <Text style={styles.buttonText}>Driving for Dollars</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#DFC5FE", 
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#A078C4",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  actionButton: {
    width: "45%",
    backgroundColor: "#A078C4",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
})

export default HomeScreen;