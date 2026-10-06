import React from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function Logo() {
  return (
    <View style={styles.container}>

      <Ionicons
        name="fast-food"
        size={42}
        color="#ff3131"
      />

      <Text style={styles.text}>
        REI DO RANGO
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  text: {
    marginTop: -2,
    color: "#ff3131",
    fontSize: 24,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
});