import AuthScreen from "./screens/auth/AuthScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function Index() {
  return (
  <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1E1B4B" />
      <View style={{ flex: 1, backgroundColor: '#1E1B4B' }}>
        <AuthScreen />
      </View>
    </SafeAreaProvider>
  )
}
