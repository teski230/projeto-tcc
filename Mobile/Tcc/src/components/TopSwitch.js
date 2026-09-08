import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function TopSwitch({
  active,
  onChange,
}) {
  return (
    <View style={styles.box}>

      <TouchableOpacity
        style={[
          styles.option,
          active === "cadastrar" && styles.active,
        ]}
        onPress={() => onChange("cadastrar")}
      >
        <Text
          style={
            active === "cadastrar"
              ? styles.activeText
              : styles.text
          }
        >
          Cadastrar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          active === "entrar" && styles.active,
        ]}
        onPress={() => onChange("entrar")}
      >
        <Text
          style={
            active === "entrar"
              ? styles.activeText
              : styles.text
          }
        >
          Entrar
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