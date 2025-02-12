import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { usePropertyContext } from "../contexts/PropertyContext"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"  // Import icons

const HomeScreen = () => {
  const navigation = useNavigation()
  const { properties, sortProperties } = usePropertyContext()

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyItem}
      onPress={() => navigation.navigate("PropertyDetail", { propertyId: item.id })}
    >
      <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
      <Text style={styles.propertyAddress}>{item.address}</Text>
      <View style={styles.tagContainer}>
        {item.tags.map((tag, index) => (
          <Text key={index} style={styles.tag}>
            {tag}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate("Map")}>
        <Ionicons name="map-outline" size={20} color="#666" />
        <Text style={styles.mapButtonText}>View Map</Text>
      </TouchableOpacity>

      <View style={styles.sortButtons}>
        <TouchableOpacity onPress={() => sortProperties("seen")} style={styles.sortButton}>
          <Text>Sort by Seen</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sortProperties("contacted")} style={styles.sortButton}>
          <Text>Sort by Contacted</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sortProperties("in discussion")} style={styles.sortButton}>
          <Text>Sort by In Discussion</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => sortProperties("bought")} style={styles.sortButton}>
          <Text>Sort by Bought</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={properties} renderItem={renderProperty} keyExtractor={(item) => item.id} numColumns={2} />

      {/* New Buttons Section */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("AddProperty")}>
          <Ionicons name="add-circle-outline" size={24} color="black" />
          <Text style={styles.buttonText}>Add an Address</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("CameraScreen")}>
          <MaterialIcons name="camera-alt" size={24} color="black" />
          <Text style={styles.buttonText}>Take a Picture</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("GalleryScreen")}>
          <MaterialIcons name="photo-library" size={24} color="black" />
          <Text style={styles.buttonText}>Use Photo Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
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
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6E6FA",
    padding: 12,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
    color: "#666",
  },
  propertyItem: {
    flex: 1,
    margin: 5,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  propertyImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
    borderRadius: 5,
  },
  propertyAddress: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  tag: {
    backgroundColor: "#ddd",
    padding: 3,
    margin: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  sortButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  sortButton: {
    padding: 5,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  actionButton: {
    width: "45%",
    backgroundColor: "#f0f0f0",
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
  },
})

export default HomeScreen
