import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useNavigation } from "@react-navigation/native"

const LoginScreen = () => {
  const navigation = useNavigation()

  const handleLogin = () => {
    // In a real app, you would implement Google OAuth here
    // For now, we'll just navigate to the Home screen
    navigation.navigate("Home")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real Estate CRM</Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login with Google</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#4285F4",
    padding: 10,
    borderRadius: 5,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
  },
})

export default LoginScreen

