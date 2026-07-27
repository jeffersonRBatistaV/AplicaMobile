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
import { saveProfile, loadProfile } from '../../services/storage'
import type { Profile } from '../../reference/types'

const COLORS = {
  bg: '#08090a',
  surface: '#0f1112',
  card: '#161819',
  border: '#1c1e1f',
  text: '#f7f8f8',
  muted: '#6b7280',
  accent: '#007AFF',
  error: '#ff3b30',
  success: '#34c759',
}

const defaultProfile: Profile = {
  name: '',
  email: '',
  phone: '',
  location: '',
  targetMarket: '',
  github: '',
  linkedin: '',
  portfolio: '',
  photo: '',
  title: '',
  summary: '',
  skills: [],
  skillLevels: {},
  experience: [],
  education: [],
  certifications: [],
  languages: [],
  projects: [],
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    loadProfile()
      .then((p) => {
        if (p) setProfile(p)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !profile.skills.includes(s)) {
      updateField('skills', [...profile.skills, s])
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    updateField(
      'skills',
      profile.skills.filter((s) => s !== skill),
    )
  }

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio')
      return
    }
    setSaving(true)
    try {
      await saveProfile(profile)
      Alert.alert('Guardado', 'Perfil guardado correctamente')
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil')
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
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '700' }}>Perfil</Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Nombre completo">
          <TextInput
            style={inputStyle}
            value={profile.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="Tu nombre"
            placeholderTextColor={COLORS.muted}
          />
        </Field>

        <Field label="Correo electrónico">
          <TextInput
            style={inputStyle}
            value={profile.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="email@ejemplo.com"
            placeholderTextColor={COLORS.muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label="Teléfono">
          <TextInput
            style={inputStyle}
            value={profile.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="+1 809-555-5555"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
          />
        </Field>

        <Field label="Resumen profesional">
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: 'top' }]}
            value={profile.summary}
            onChangeText={(v) => updateField('summary', v)}
            placeholder="Breve descripción de tu experiencia..."
            placeholderTextColor={COLORS.muted}
            multiline
          />
        </Field>

        <Field label="Área profesional">
          <TextInput
            style={inputStyle}
            value={profile.title}
            onChangeText={(v) => updateField('title', v)}
            placeholder="Ej: Frontend Developer, Contador..."
            placeholderTextColor={COLORS.muted}
          />
        </Field>

        <Field label="Años de experiencia">
          <TextInput
            style={inputStyle}
            value={
              profile.experience.length > 0
                ? `${profile.experience[0].startDate} - ${profile.experience[0].endDate || 'Presente'}`
                : ''
            }
            onChangeText={(v) => {
              const parts = v.split(' - ')
              const exp = [
                {
                  company: '',
                  position: '',
                  startDate: parts[0] || '',
                  endDate: parts[1] || null,
                  description: '',
                  highlights: [],
                },
              ]
              updateField('experience', exp)
            }}
            placeholder="2018 - Presente"
            placeholderTextColor={COLORS.muted}
          />
        </Field>

        <Field label="Skills">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {profile.skills.map((skill) => (
              <View
                key={skill}
                style={{
                  backgroundColor: COLORS.accent + '20',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ color: COLORS.accent, fontSize: 14 }}>{skill}</Text>
                <TouchableOpacity onPress={() => removeSkill(skill)}>
                  <Ionicons name="close-circle" size={16} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              value={skillInput}
              onChangeText={setSkillInput}
              placeholder="Agregar skill..."
              placeholderTextColor={COLORS.muted}
              onSubmitEditing={addSkill}
            />
            <TouchableOpacity
              onPress={addSkill}
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 10,
                width: 44,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Field>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Guardar Perfil</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' }}>
        {label}
      </Text>
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
