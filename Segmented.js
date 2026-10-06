import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Segmented({ opcoes, valor, onChange }) {
  return (
    <View style={s.wrap}>
      {opcoes.map((o) => {
        const ativo = valor === o.valor;
        return (
          <TouchableOpacity
            key={o.valor}
            style={[s.item, ativo && s.itemAtivo]}
            onPress={() => onChange(o.valor)}
            activeOpacity={0.8}
          >
            <Text style={[s.texto, ativo && s.textoAtivo]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 5,
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  itemAtivo: { backgroundColor: "#FF4040" },
  texto: { fontSize: 12, fontWeight: "600", color: "#111" },
  textoAtivo: { color: "#fff", fontWeight: "bold" },
});