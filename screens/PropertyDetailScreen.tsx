import { useEffect, useState } from "react"
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from "react-native"
import { usePropertyContext } from "../contexts/PropertyContext"
import { useNavigation } from "@react-navigation/native"

const PropertyDetailScreen = ({ route }) => {
  const { propertyId } = route.params
  const { properties, updateProperty, removeProperty } = usePropertyContext()
  const navigation = useNavigation()
  const property = properties.find((p) => p.id === propertyId)

  const [notes, setNotes] = useState(property.notes)

  // Update the status when a tag is tapped
  const toggleTag = (tag) => {
    console.log("Toggling tag:", tag)
    const newStatus = property.status === tag ? "Lead" : tag
    updateProperty(propertyId, { status: newStatus })
  }

  // Save notes when the Save button is pressed
  const handleSaveNotes = () => {
    console.log("Saving notes:", notes)
    updateProperty(propertyId, { notes: notes })
  }

  useEffect(() => {
    handleSaveNotes()
  }, [notes])

  const handleRemoveProperty = () => {
    removeProperty(propertyId)
    navigation.goBack()
  }

  if (!property) return <Text>Property not found</Text>

  return (
    <ScrollView style={styles.container}>
      <FlatList
        data={property.images}
        renderItem={({ item }) => <Image source={{ uri: item }} style={styles.propertyImage} />}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
      />
      <Text style={styles.propertyAddress}>{property.address}</Text>

      <View style={styles.tagContainer}>
        {["seen", "contacted", "in discussion", "bought"].map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, property.status === tag && styles.activeTag]}
            onPress={() => toggleTag(tag)}
          >
            <Text>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.notesInput}
        multiline
        value={notes}
        onChangeText={setNotes}
        placeholder="Add notes here..."
      />

      {/* <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes}>
        <Text>Save Notes</Text>
      </TouchableOpacity> */}

      <TouchableOpacity style={styles.removeButton} onPress={handleRemoveProperty}>
        <Text style={styles.removeButtonText}>Remove Property</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  propertyImage: {
    width: 300,
    height: 200,
    resizeMode: "cover",
    borderRadius: 5,
    marginRight: 10,
  },
  propertyAddress: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#ddd",
    padding: 5,
    margin: 2,
    borderRadius: 3,
  },
  activeTag: {
    backgroundColor: "#007AFF",
  },
  notesInput: {
    marginTop: 10,
    padding: 10,
    height: 100,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 5,
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  removeButton: {
    marginTop: 20,
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  removeButtonText: {
    color: "white",
  },
})

export default PropertyDetailScreen;
