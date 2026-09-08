import React, { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

import LoginScreen from "./src/screens/LoginScreen";
import CadastroScreen from "./src/screens/CadastroScreen";

export default function App() {
  const [tela, setTela] = useState("login");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {tela === "login" ? (
        <LoginScreen
          onCadastro={() => setTela("cadastro")}
        />
      ) : (
        <CadastroScreen
          onEntrar={() => setTela("login")}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});