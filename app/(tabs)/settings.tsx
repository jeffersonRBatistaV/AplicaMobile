import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { loadSettings, saveSettings } from '../../services/storage'
import type { AppSettings } from '../../reference/types'

const COLORS = {
  bg: '#08090a',
  surface: '#0f1112',
  card: '#161819',
  border: '#1c1e1f',
  text: '#f7f8f8',
  muted: '#6b7280',
  accent: '#007AFF',
}

const DEFAULT_SETTINGS: AppSettings = {
  api: {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    model: 'llama3',
    configured: false,
  },
  appearance: { mode: 'dark' },
  privacy: { storeHistory: true, excludeFromTraining: true },
  systemPrompt: '',
  locale: 'es',
  ttsVoice: '',
  preferredCurrency: 'USD',
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
      .then((s) => {
        if (s) setSettings(s)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateApi = (key: 'baseUrl' | 'apiKey' | 'model', value: string) => {
    setSettings((prev) => ({
      ...prev,
      api: { ...prev.api, [key]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSettings({
        ...settings,
        api: { ...settings.api, configured: true },
      })
      Alert.alert('Guardado', 'Configuración guardada correctamente')
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '700' }}>Ajustes</Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>
          API - OpenAI Compatible
        </Text>

        <Field label="URL del API">
          <TextInput
            style={inputStyle}
            value={settings.api.baseUrl}
            onChangeText={(v) => updateApi('baseUrl', v)}
            placeholder="http://localhost:11434/v1"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="API Key">
          <TextInput
            style={inputStyle}
            value={settings.api.apiKey}
            onChangeText={(v) => updateApi('apiKey', v)}
            placeholder="sk-..."
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </Field>

        <Field label="Modelo">
          <TextInput
            style={inputStyle}
            value={settings.api.model}
            onChangeText={(v) => updateApi('model', v)}
            placeholder="llama3, gpt-4, etc."
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Ionicons name="information-circle" size={20} color={COLORS.accent} />
            <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18, flex: 1 }}>
              Esta app usa APIs compatibles con OpenAI. Por defecto apunta a Ollama (localhost:11434).
              Puedes cambiarlo a cualquier proveedor compatible como OpenAI, Together AI, o Anthropic.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Guardar Configuración</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  )
}

const inputStyle = {
  backgroundColor: COLORS.card,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: COLORS.text,
  fontSize: 15,
  borderWidth: 1,
  borderColor: COLORS.border,
}
