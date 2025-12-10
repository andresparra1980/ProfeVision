import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { TurnstileWebView } from "../components/TurnstileWebView";

const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || "";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa email y contrasena");
      return;
    }

    if (!captchaToken) {
      Alert.alert("Error", "Por favor completa el captcha");
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email.trim(), password, captchaToken);
    setIsSubmitting(false);

    if (error) {
      setCaptchaToken(null); // Reset captcha on error
      Alert.alert("Error de autenticacion", error.message);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    console.error("Captcha error:", error);
    Alert.alert("Error", "Error al verificar captcha. Intenta de nuevo.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.title}>ProfeVision</Text>
          <Text style={styles.subtitle}>Inicia sesion para continuar</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!isSubmitting}
            />

            <TextInput
              style={styles.input}
              placeholder="Contrasena"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!isSubmitting}
            />

            {TURNSTILE_SITE_KEY ? (
              <View style={styles.captchaContainer}>
                <TurnstileWebView
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                />
                {captchaToken && <Text style={styles.captchaSuccess}>Verificado</Text>}
              </View>
            ) : (
              <Text style={styles.captchaWarning}>Captcha no configurado</Text>
            )}

            <TouchableOpacity
              style={[styles.button, (isSubmitting || !captchaToken) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting || !captchaToken}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesion</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.registerHint}>No tienes cuenta? Registrate en profevision.com</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  captchaContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  captchaSuccess: {
    color: "#16a34a",
    fontSize: 14,
    marginTop: 4,
  },
  captchaWarning: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#93c5fd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerHint: {
    marginTop: 24,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
});
