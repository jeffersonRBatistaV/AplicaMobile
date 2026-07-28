import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadProfile, loadSettings, saveRoadmap, loadRoadmaps } from "../services/storage";
import { chatCompletion } from "../services/api";

export default function RoadmapScreen() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadRoadmaps().then(setRoadmaps); }, []);

  const generateRoadmap = async () => {
    if (!topic.trim()) { Alert.alert("Error", "Ingresa un tema"); return; }
    setLoading(true);
    try {
      const profile = await loadProfile();
      const settings = await loadSettings();
      const prompt = `Genera un roadmap de aprendizaje personalizado para: ${topic}. Perfil del usuario: ${JSON.stringify(profile)}. Formato: lista de pasos con titulo, descripcion, recursos sugeridos y tiempo estimado. Responde en español.`;
      const res = await chatCompletion(
        [{ role: "system", content: "Eres un experto en generar roadmaps de aprendizaje personalizados." }, { role: "user", content: prompt }],
        settings.apiUrl || "http://localhost:11434/v1",
        settings.apiKey || "",
        settings.model || "gpt-3.5-turbo"
      );
      setRoadmap(res);
      const newRoadmap = { id: Date.now().toString(), topic, result: res, createdAt: new Date().toISOString() };
      await saveRoadmap(newRoadmap);
      setRoadmaps(prev => [...prev, newRoadmap]);
    } catch (e) {
      Alert.alert("Error", "No se pudo generar el roadmap. Verifica tu conexion a la API.");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#08090a" }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#f7f8f8" }}>Roadmap</Text>
          <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
            <Text style={{ color: "#007AFF", fontSize: 14 }}>{showHistory ? "Nuevo" : "Historial"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 14, color: "#8a8f98", marginBottom: 24 }}>Genera un plan de aprendizaje personalizado para cualquier tema.</Text>
        
        {!showHistory ? (
          <>
            <TextInput
              style={{ backgroundColor: "#161819", color: "#f7f8f8", borderRadius: 8, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#2a2b2e", marginBottom: 12 }}
              placeholder="¿Que quieres aprender? ej: React Native, Piano, ML..."
              placeholderTextColor="#6b7280"
              value={topic}
              onChangeText={setTopic}
            />
            <TouchableOpacity
              style={{ backgroundColor: "#007AFF", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 24 }}
              onPress={generateRoadmap}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Generar Roadmap</Text>}
            </TouchableOpacity>

            {roadmap && (
              <View style={{ backgroundColor: "#161819", borderRadius: 8, padding: 16, borderWidth: 1, borderColor: "#2a2b2e" }}>
                <Text style={{ fontSize: 14, color: "#d0d6e0", lineHeight: 20 }}>{roadmap}</Text>
              </View>
            )}
          </>
        ) : (
          roadmaps.length === 0 ? (
            <Text style={{ color: "#6b7280", textAlign: "center", marginTop: 40 }}>No hay roadmaps guardados</Text>
          ) : (
            roadmaps.slice().reverse().map(r => (
              <TouchableOpacity key={r.id} style={{ backgroundColor: "#161819", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#2a2b2e" }} onPress={() => { setTopic(r.topic); setRoadmap(r.result); setShowHistory(false); }}>
                <Text style={{ color: "#007AFF", fontWeight: "600", marginBottom: 4 }}>{r.topic}</Text>
                <Text style={{ color: "#6b7280", fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
