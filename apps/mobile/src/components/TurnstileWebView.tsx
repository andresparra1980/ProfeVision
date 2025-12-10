import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

interface TurnstileWebViewProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
}

const TURNSTILE_URL = "https://profevision.com/turnstile.html";

export function TurnstileWebView({ siteKey, onVerify, onError }: TurnstileWebViewProps) {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("[Turnstile]", data);
      if (data.type === "success" && data.token) {
        onVerify(data.token);
      } else if (data.type === "error") {
        onError?.(data.error || "Captcha verification failed");
      }
    } catch {
      onError?.("Failed to parse captcha response");
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: `${TURNSTILE_URL}?siteKey=${siteKey}` }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={["*"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    width: "100%",
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
