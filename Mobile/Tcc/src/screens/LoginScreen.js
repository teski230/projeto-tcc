import React, { useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import Logo from "../components/Logo";
import TopSwitch from "../components/TopSwitch";
import RoleSwitch from "../components/RoleSwitch";
import Input from "../components/Input";

const RED = "#ff3131";
const CARD = "#eee9e9";

export default function LoginScreen({
  onCadastro,
}) {
  const [tipo, setTipo] = useState("entrar");
  const [role, setRole] = useState("cliente");

  function entrar() {
    Alert.alert(
      "Rei do Rango",
      "Login será conectado à API na próxima etapa."
    );
  }

  function mudarTela(valor) {
    setTipo(valor);

    if (valor === "cadastrar") {
      onCadastro();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <Logo />

        <View style={styles.card}>

          <TopSwitch
            active={tipo}
            onChange={mudarTela}
          />

          <RoleSwitch
            role={role}
            onChange={setRole}
          />

          <View style={styles.form}>

            <Input
              label="Email / Nome de usuário"
            />

            <Input
              label="Senha"
              secureTextEntry={true}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={entrar}
            >
              <Text style={styles.buttonText}>
                Entrar
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 25,
  },

  card: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 10,
    paddingBottom: 18,
  },

  form: {
    paddingHorizontal: 1,
    paddingTop: 20,
  },

  button: {
    height: 47,
    borderRadius: 25,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});