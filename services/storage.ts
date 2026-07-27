import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Profile, Conversation, AppSettings, JobApplication } from '../reference/types'

const KEYS = {
  profile: '@aplica/profile',
  chats: '@aplica/chats',
  settings: '@aplica/settings',
  jobs: '@aplica/jobs',
}

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile))
}

export async function loadProfile(): Promise<Profile | null> {
  const data = await AsyncStorage.getItem(KEYS.profile)
  return data ? JSON.parse(data) : null
}

export async function saveChat(conversation: Conversation): Promise<void> {
  const existing = await loadChat(conversation.id)
  if (existing) {
    const all = await loadAllChats()
    const idx = all.findIndex((c) => c.id === conversation.id)
    if (idx !== -1) all[idx] = conversation
    await AsyncStorage.setItem(KEYS.chats, JSON.stringify(all))
  } else {
    const all = await loadAllChats()
    all.push(conversation)
    await AsyncStorage.setItem(KEYS.chats, JSON.stringify(all))
  }
}

export async function loadChat(id: string): Promise<Conversation | null> {
  const all = await loadAllChats()
  return all.find((c) => c.id === id) ?? null
}

export async function loadAllChats(): Promise<Conversation[]> {
  const data = await AsyncStorage.getItem(KEYS.chats)
  return data ? JSON.parse(data) : []
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

export async function loadSettings(): Promise<AppSettings | null> {
  const data = await AsyncStorage.getItem(KEYS.settings)
  return data ? JSON.parse(data) : null
}

export async function saveJobs(jobs: JobApplication[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.jobs, JSON.stringify(jobs))
}

export async function loadJobs(): Promise<JobApplication[]> {
  const data = await AsyncStorage.getItem(KEYS.jobs)
  return data ? JSON.parse(data) : []
}
