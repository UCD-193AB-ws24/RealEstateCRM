import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { PropertyProvider } from "./contexts/PropertyContext"
import HomeScreen from "./screens/HomeScreen"
import PropertyDetailScreen from "./screens/PropertyDetailScreen"
import LoginScreen from "./screens/LoginScreen"

const Stack = createStackNavigator()

export default function App() {
  return (
    <PropertyProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PropertyProvider>
  )
}

