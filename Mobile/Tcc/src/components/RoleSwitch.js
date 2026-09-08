import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function RoleSwitch({
  role,
  onChange,
}) {
  return (
    <View style={styles.box}>

      <TouchableOpacity
        style={[
          styles.option,
          role === "cliente" && styles.active,
        ]}
        onPress={() => onChange("cliente")}
      >
        <Text
          style={
            role === "cliente"
              ? styles.activeText
              : styles.text
          }
        >
          Cliente
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          role === "entregador" && styles.active,
        ]}
        onPress={() => onChange("entregador")}
      >
        <Text
          style={
            role === "entregador"
              ? styles.activeText
              : styles.text
          }
        >
          Entregador
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    marginTop: 8,
  },

  option: {
    flex: 1,
    height: 28,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  active: {
    backgroundColor: "#ff3131",
  },

  text: {
    fontSize: 10,
    color: "#111",
  },

  activeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
});