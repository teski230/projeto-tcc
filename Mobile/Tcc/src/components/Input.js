import React from "react";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";

export default function Input({
  label,
  placeholder,
  secureTextEntry = false,
}) {
  return (
    <View style={styles.container}>

      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#d6d2d2"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 22,
  },

  label: {
    fontSize: 11,
    color: "#111",
    marginLeft: 12,
    marginBottom: 7,
  },

  input: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 18,
    fontSize: 12,
  },
});