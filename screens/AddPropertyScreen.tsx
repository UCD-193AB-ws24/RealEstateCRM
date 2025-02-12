import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { usePropertyContext } from "../contexts/PropertyContext"
import { useNavigation } from "@react-navigation/native"
import { v4 as uuidv4 } from "uuid"

const AddPropertyScreen = () => {
  const navigation = useNavigation()
  const { addProperty } = usePropertyContext()

  const [address, setAddress] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("seen")  // Default status

  const handleAddProperty = () => {
    const newProperty = {
      id: uuidv4(),  // Unique ID
      address,
      owner: { name: ownerName, phone, email },
      notes,
      tags: [status],
      images: []  // No images yet
    }

    addProperty(newProperty)
    navigation.goBack() // Navigate back to HomeScreen
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter address" />

      <Text style={styles.label}>Owner's Name</Text>
      <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} placeholder="Enter owner's name" />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Enter notes" multiline />

      <Text style={styles.label}>Status</Text>
      <View style={styles.buttonGroup}>
        {["seen", "contacted", "in discussion", "bought"].map((tag) => (
          <TouchableOpacity key={tag} style={[styles.tagButton, status === tag && styles.activeTag]} onPress={() => setStatus(tag)}>
            <Text>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
        <Text style={styles.addButtonText}>Add Property</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  buttonGroup: {
    flexDirection: "row",
    marginVertical: 10,
  },
  tagButton: {
    padding: 8,
    backgroundColor: "#ddd",
    marginHorizontal: 5,
    borderRadius: 5,
  },
  activeTag: {
    backgroundColor: "#007AFF",
  },
  addButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
  },
})

export default AddPropertyScreen
