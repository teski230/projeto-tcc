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

export default function CadastroScreen({ onEntrar }) {
  const [tipo, setTipo] = useState("cadastrar");
  const [role, setRole] = useState("cliente");

  function confirmar() {
    Alert.alert(
      "Rei do Rango",
      "Cadastro será conectado à API na próxima etapa."
    );
  }

  function mudarTela(valor) {
    setTipo(valor);

    if (valor === "entrar") {
      onEntrar();
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Logo />

        <View style={styles.card}>

          {/* Cadastrar / Entrar */}
          <TopSwitch
            active={tipo}
            onChange={mudarTela}
          />

          {/* Cliente / Entregador */}
          <RoleSwitch
            role={role}
            onChange={setRole}
          />

          <View style={styles.form}>

            {/* Campos normais */}
            <Input
              label="Nome Completo"
              placeholder="Digite seu nome"
            />

            <Input
              label="Email"
              placeholder="Digite seu email"
            />

            <Input
              label="Senha"
              placeholder="Digite sua senha"
              secureTextEntry={true}
            />

            {/* Campos extras do entregador */}
            {role === "entregador" && (
              <>
                <Input
                  label="CNH"
                  placeholder="Digite sua CNH"
                />

                <Input
                  label="Telefone"
                  placeholder="Digite seu telefone"
                />

                <Input
                  label="Veículo"
                  placeholder="Ex: Honda CG 160"
                />

                <Input
                  label="Placa"
                  placeholder="Ex: ABC1D23"
                />
              </>
            )}

            {/* Botão */}
            <TouchableOpacity
              style={styles.button}
              onPress={confirmar}
            >
              <Text style={styles.buttonText}>
                Solicitar
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