import React, { useState, useEffect, useRef } from "react"
import { View, TouchableOpacity, Text, StyleSheet } from "react-native"
import { Camera } from "expo-camera"
import { useNavigation } from "@react-navigation/native"

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null)
  const cameraRef = useRef(null)
  const navigation = useNavigation()

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    })()
  }, [])

  if (hasPermission === null) {
    return <View />
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} ref={cameraRef} />
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default CameraScreen