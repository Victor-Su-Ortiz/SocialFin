import AuthScreen from "./screens/auth/AuthScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaProvider>
       <AuthScreen />
    </SafeAreaProvider>
  )
}
