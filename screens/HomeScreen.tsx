import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { usePropertyContext } from "../contexts/PropertyContext"

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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
})

export default HomeScreen

