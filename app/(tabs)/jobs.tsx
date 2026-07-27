import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { loadJobs, saveJobs } from '../../services/storage'
import type { JobApplication, JobStatus } from '../../reference/types'

const COLORS = {
  bg: '#08090a',
  surface: '#0f1112',
  card: '#161819',
  border: '#1c1e1f',
  text: '#f7f8f8',
  muted: '#6b7280',
  accent: '#007AFF',
  success: '#34c759',
  warning: '#ff9500',
  error: '#ff3b30',
}

const STATUSES: { key: JobStatus; label: string; color: string }[] = [
  { key: 'draft', label: 'Pendiente', color: COLORS.muted },
  { key: 'applied', label: 'Aplicado', color: COLORS.accent },
  { key: 'interview', label: 'Entrevista', color: COLORS.warning },
  { key: 'offer', label: 'Oferta', color: COLORS.success },
  { key: 'rejected', label: 'Rechazado', color: COLORS.error },
]

const STATUS_ORDER: JobStatus[] = ['draft', 'applied', 'interview', 'offer', 'rejected']

let idCounter = 0
const genId = () => `job_${Date.now()}_${++idCounter}`

export default function JobsScreen() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editJob, setEditJob] = useState<Partial<JobApplication>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadJobs()
      .then(setJobs)
      .finally(() => setLoading(false))
  }, [])

  const persistJobs = useCallback(
    async (updated: JobApplication[]) => {
      setJobs(updated)
      await saveJobs(updated)
    },
    [],
  )

  const openAddModal = () => {
    setEditJob({ company: '', position: '', status: 'draft' })
    setEditingId(null)
    setModalVisible(true)
  }

  const openEditModal = (job: JobApplication) => {
    setEditJob({ ...job })
    setEditingId(job.id)
    setModalVisible(true)
  }

  const saveJob = async () => {
    if (!editJob.company?.trim() || !editJob.position?.trim()) {
      Alert.alert('Error', 'Empresa y cargo son obligatorios')
      return
    }
    const now = Date.now()
    if (editingId) {
      const updated = jobs.map((j) =>
        j.id === editingId
          ? { ...j, ...editJob, updatedAt: now } as JobApplication
          : j,
      )
      await persistJobs(updated)
    } else {
      const job: JobApplication = {
        id: genId(),
        createdAt: now,
        updatedAt: now,
        company: editJob.company || '',
        position: editJob.position || '',
        category: editJob.category || '',
        status: (editJob.status as JobStatus) || 'draft',
        vacancyText: editJob.vacancyText || '',
        atsReport: null,
        coverLetterA: '',
        coverLetterB: '',
        cvStyle: null,
        cvContent: '',
        recipientEmail: '',
        emailSubject: '',
        interviewQuestions: [],
      }
      await persistJobs([...jobs, job])
    }
    setModalVisible(false)
    setEditJob({})
  }

  const deleteJob = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar esta postulación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await persistJobs(jobs.filter((j) => j.id !== id))
        },
      },
    ])
  }

  const moveStatus = (id: string, direction: -1 | 1) => {
    const job = jobs.find((j) => j.id === id)
    if (!job) return
    const idx = STATUS_ORDER.indexOf(job.status)
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= STATUS_ORDER.length) return
    const updated = jobs.map((j) =>
      j.id === id ? { ...j, status: STATUS_ORDER[newIdx], updatedAt: Date.now() } : j,
    )
    persistJobs(updated)
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
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '700' }}>Postulaciones</Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
        showsHorizontalScrollIndicator={false}
      >
        {STATUSES.map((status) => {
          const columnJobs = jobs.filter((j) => j.status === status.key)
          return (
            <View
              key={status.key}
              style={{
                width: 220,
                marginHorizontal: 4,
                backgroundColor: COLORS.surface,
                borderRadius: 12,
                padding: 10,
                maxHeight: '100%',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: status.color }} />
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{status.label}</Text>
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>{columnJobs.length}</Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {columnJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    onPress={() => openEditModal(job)}
                    style={{
                      backgroundColor: COLORS.card,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '600' }}>{job.position}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{job.company}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation()
                          moveStatus(job.id, -1)
                        }}
                        style={{ padding: 4 }}
                        disabled={STATUS_ORDER.indexOf(job.status) === 0}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={18}
                          color={STATUS_ORDER.indexOf(job.status) === 0 ? COLORS.border : COLORS.accent}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation()
                          deleteJob(job.id)
                        }}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation()
                          moveStatus(job.id, 1)
                        }}
                        style={{ padding: 4 }}
                        disabled={STATUS_ORDER.indexOf(job.status) === STATUS_ORDER.length - 1}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={
                            STATUS_ORDER.indexOf(job.status) === STATUS_ORDER.length - 1
                              ? COLORS.border
                              : COLORS.accent
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: COLORS.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '700' }}>
                {editingId ? 'Editar Postulación' : 'Nueva Postulación'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 }}>Empresa</Text>
            <TextInput
              style={modalInput}
              value={editJob.company || ''}
              onChangeText={(v) => setEditJob((prev) => ({ ...prev, company: v }))}
              placeholder="Nombre de la empresa"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 12, marginBottom: 6 }}>Cargo</Text>
            <TextInput
              style={modalInput}
              value={editJob.position || ''}
              onChangeText={(v) => setEditJob((prev) => ({ ...prev, position: v }))}
              placeholder="Posición / Cargo"
              placeholderTextColor={COLORS.muted}
            />

            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 12, marginBottom: 6 }}>Estado</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {STATUSES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => setEditJob((prev) => ({ ...prev, status: s.key }))}
                  style={{
                    backgroundColor: editJob.status === s.key ? s.color : COLORS.card,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      color: editJob.status === s.key ? '#fff' : COLORS.muted,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 }}>Descripción de la vacante</Text>
            <TextInput
              style={[modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={editJob.vacancyText || ''}
              onChangeText={(v) => setEditJob((prev) => ({ ...prev, vacancyText: v }))}
              placeholder="Texto de la vacante (opcional)"
              placeholderTextColor={COLORS.muted}
              multiline
            />

            <TouchableOpacity
              onPress={saveJob}
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 12,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                {editingId ? 'Guardar Cambios' : 'Agregar Postulación'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const modalInput = {
  backgroundColor: COLORS.card,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: COLORS.text,
  fontSize: 15,
  borderWidth: 1,
  borderColor: COLORS.border,
}
