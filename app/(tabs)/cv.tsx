import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { loadProfile } from '../../services/storage'
import type { Profile } from '../../reference/types'

const COLORS = {
  bg: '#08090a',
  surface: '#0f1112',
  card: '#161819',
  border: '#1c1e1f',
  text: '#f7f8f8',
  muted: '#6b7280',
  accent: '#007AFF',
  success: '#34c759',
}

type CvStyle = 'modern' | 'classic' | 'minimal'

const STYLES: { id: CvStyle; name: string }[] = [
  { id: 'modern', name: 'Moderno' },
  { id: 'classic', name: 'Clásico' },
  { id: 'minimal', name: 'Minimalista' },
]

export default function CvScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStyle, setSelectedStyle] = useState<CvStyle>('modern')

  useEffect(() => {
    loadProfile()
      .then(setProfile)
      .finally(() => setLoading(false))
  }, [])

  const handleShare = async () => {
    const text = generateCvText(profile, selectedStyle)
    try {
      await Share.share({
        message: text,
        title: `CV - ${profile?.name || 'Sin nombre'}`,
      })
    } catch {
      Alert.alert('Error', 'No se pudo compartir el CV')
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    )
  }

  if (!profile || !profile.name) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.muted} />
        <Text style={{ color: COLORS.muted, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
          Completa tu perfil primero para ver una vista previa del CV
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '700' }}>Mi CV</Text>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 }}>
        {STYLES.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => setSelectedStyle(s.id)}
            style={{
              flex: 1,
              backgroundColor: selectedStyle === s.id ? COLORS.accent : COLORS.card,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: selectedStyle === s.id ? '#fff' : COLORS.text,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          {selectedStyle === 'modern' && <CvModern profile={profile} />}
          {selectedStyle === 'classic' && <CvClassic profile={profile} />}
          {selectedStyle === 'minimal' && <CvMinimal profile={profile} />}
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            height: 50,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
          }}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Compartir CV</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

function CvModern({ profile }: { profile: Profile }) {
  return (
    <View>
      <View style={{ borderBottomWidth: 2, borderBottomColor: COLORS.accent, paddingBottom: 12, marginBottom: 16 }}>
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '700' }}>{profile.name}</Text>
        <Text style={{ color: COLORS.accent, fontSize: 15, marginTop: 2 }}>{profile.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          {profile.email ? <InfoBadge icon="mail" text={profile.email} /> : null}
          {profile.phone ? <InfoBadge icon="call" text={profile.phone} /> : null}
          {profile.location ? <InfoBadge icon="location" text={profile.location} /> : null}
        </View>
      </View>
      {profile.summary ? (
        <Section title="Perfil">
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>{profile.summary}</Text>
        </Section>
      ) : null}
      {profile.skills.length > 0 ? (
        <Section title="Habilidades">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {profile.skills.map((s) => (
              <View key={s} style={{ backgroundColor: COLORS.accent + '20', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: COLORS.accent, fontSize: 13 }}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}
      {profile.experience.length > 0 ? (
        <Section title="Experiencia">
          {profile.experience.map((exp, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '600' }}>{exp.position}</Text>
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                {exp.company} | {exp.startDate} - {exp.endDate || 'Presente'}
              </Text>
              {exp.description ? (
                <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>{exp.description}</Text>
              ) : null}
            </View>
          ))}
        </Section>
      ) : null}
    </View>
  )
}

function CvClassic({ profile }: { profile: Profile }) {
  return (
    <View>
      <View style={{ alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 16 }}>
        <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '700', textTransform: 'uppercase' }}>{profile.name}</Text>
        <Text style={{ color: COLORS.text, fontSize: 14, marginTop: 2 }}>{profile.title}</Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
          {[profile.email, profile.phone, profile.location].filter(Boolean).join(' | ')}
        </Text>
      </View>
      {profile.summary ? (
        <Section title="RESUMEN">
          <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: 'justify' }}>{profile.summary}</Text>
        </Section>
      ) : null}
      {profile.skills.length > 0 ? (
        <Section title="HABILIDADES">
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>{profile.skills.join(', ')}</Text>
        </Section>
      ) : null}
    </View>
  )
}

function CvMinimal({ profile }: { profile: Profile }) {
  return (
    <View>
      <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: '300', letterSpacing: 1 }}>{profile.name}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 14, fontWeight: '300', marginTop: 2 }}>{profile.title}</Text>
      <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 16 }} />
      {profile.summary ? (
        <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, fontWeight: '300', marginBottom: 16 }}>
          {profile.summary}
        </Text>
      ) : null}
      {profile.skills.length > 0 ? (
        <>
          <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Habilidades</Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, fontWeight: '300' }}>{profile.skills.join(' · ')}</Text>
        </>
      ) : null}
      {profile.email || profile.phone ? (
        <>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 16 }} />
          <Text style={{ color: COLORS.muted, fontSize: 14, fontWeight: '300' }}>
            {[profile.email, profile.phone].filter(Boolean).join(' · ')}
          </Text>
        </>
      ) : null}
    </View>
  )
}

function InfoBadge({ icon, text }: { icon: string; text: string }) {
  const iconName = icon === 'mail' ? 'mail' : icon === 'call' ? 'call' : 'location'
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={iconName as any} size={13} color={COLORS.muted} />
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{text}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        {title}
      </Text>
      {children}
    </View>
  )
}

function generateCvText(profile: Profile | null, style: CvStyle): string {
  if (!profile) return ''
  const lines = [
    `${profile.name}`,
    `${profile.title || ''}`,
    `${[profile.email, profile.phone].filter(Boolean).join(' | ')}`,
    '',
  ]
  if (profile.summary) lines.push(profile.summary, '')
  if (profile.skills.length > 0) lines.push('Habilidades:', profile.skills.join(', '), '')
  return lines.join('\n')
}
