import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { chatCompletion } from '../../services/api'
import {
  loadSettings,
  loadProfile,
  saveChat,
  loadAllChats,
  loadActiveConvId,
  saveActiveConvId,
} from '../../services/storage'
import type { Message, Conversation } from '../../reference/types'

const COLORS = {
  bg: '#08090a',
  surface: '#0f1112',
  card: '#161819',
  border: '#1c1e1f',
  text: '#f7f8f8',
  muted: '#6b7280',
  accent: '#007AFF',
  userBubble: '#007AFF',
  botBubble: '#1c1e1f',
}

let idCounter = 0
const genId = () => `msg_${Date.now()}_${++idCounter}`

const WELCOME_MSG: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy tu asistente de carrera. Puedo ayudarte con tu CV, preparar entrevistas, o responder preguntas sobre tu búsqueda laboral.',
  timestamp: Date.now(),
}

const newConversation = (): Conversation => ({
  id: `conv_${Date.now()}`,
  title: 'Nueva conversación',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  archived: false,
  messages: [WELCOME_MSG],
})

export default function ChatScreen() {
  const [conversation, setConversation] = useState<Conversation>(newConversation)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const messages = conversation.messages

  useEffect(() => {
    ;(async () => {
      const activeId = await loadActiveConvId()
      if (activeId) {
        const saved = await loadAllChats()
        const active = saved.find((c) => c.id === activeId)
        if (active) setConversation(active)
      }
    })()
  }, [])

  const refreshConversations = useCallback(async () => {
    setConversations(await loadAllChats())
  }, [])

  const switchConversation = useCallback(async (conv: Conversation) => {
    setConversation(conv)
    await saveActiveConvId(conv.id)
    setModalVisible(false)
  }, [])

  const createNew = useCallback(async () => {
    const conv = newConversation()
    setConversation(conv)
    await saveActiveConvId(conv.id)
    setModalVisible(false)
  }, [])

  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setConversation((prev) => ({
      ...prev,
      messages: typeof updater === 'function' ? updater(prev.messages) : updater,
    }))
  }

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg])
  }

  const updateLastMessage = (content: string) => {
    setMessages((prev) => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      if (last && last.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content }
      }
      return copy
    })
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')

    const userMsg: Message = {
      id: genId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    appendMessage(userMsg)

    const assistantMsg: Message = {
      id: genId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    appendMessage(assistantMsg)
    setStreaming(true)

    const settings = await loadSettings()
    const apiUrl = settings?.api?.baseUrl || 'http://localhost:11434/v1'
    const apiKey = settings?.api?.apiKey || ''
    const model = settings?.api?.model || 'llama3'

    const profile = await loadProfile()
    const systemMsg = profile
      ? `Eres un asistente de carrera profesional. Ayudas a ${profile.name || 'un profesional'} que trabaja como ${profile.title || 'profesional'}. Responde en español y sé útil y conciso.`
      : 'Eres un asistente de carrera profesional. Responde en español.'

    const apiMessages = [
      { role: 'system' as const, content: systemMsg },
      ...messages
        .concat(userMsg)
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    abortRef.current = new AbortController()

    try {
      let fullContent = ''
      await chatCompletion(
        apiMessages,
        apiUrl,
        apiKey,
        model,
        (chunk) => {
          if (chunk.done) return
          fullContent += chunk.content
          updateLastMessage(fullContent)
        },
        abortRef.current.signal,
      )

      const updated: Conversation = {
        ...conversation,
        title: conversation.messages.length <= 1 ? userMsg.content.slice(0, 50) : conversation.title,
        updatedAt: Date.now(),
        messages: [...messages, userMsg, { ...assistantMsg, content: fullContent }],
      }
      setConversation(updated)
      await saveChat(updated)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        updateLastMessage('Error al conectar con el servidor. Verifica la configuración en Ajustes.')
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  const stopStreaming = () => {
    abortRef.current?.abort()
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user'
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          backgroundColor: isUser ? COLORS.userBubble : COLORS.botBubble,
          borderRadius: 16,
          borderBottomRightRadius: isUser ? 4 : 16,
          borderBottomLeftRadius: isUser ? 16 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          maxWidth: '80%',
          marginBottom: 8,
        }}
      >
        <Text style={{ color: isUser ? '#fff' : COLORS.text, fontSize: 15, lineHeight: 20 }}>
          {item.content}
          {streaming && !isUser && item.id === messages[messages.length - 1]?.id && !item.content && (
            <ActivityIndicator size="small" color={COLORS.muted} />
          )}
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity onPress={() => { refreshConversations(); setModalVisible(true) }} style={{ flexShrink: 1 }}>
          <Text
            style={{ color: COLORS.text, fontSize: 28, fontWeight: '700' }}
            numberOfLines={1}
          >
            {conversation.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={createNew} style={{ marginLeft: 12 }}>
          <Ionicons name="add-circle" size={28} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        style={{ flex: 1 }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.surface,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: COLORS.text,
            fontSize: 15,
            borderWidth: 1,
            borderColor: COLORS.border,
            maxHeight: 100,
          }}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={COLORS.muted}
          multiline
          editable={!streaming}
        />
        {streaming ? (
          <TouchableOpacity
            onPress={stopStreaming}
            style={{
              marginLeft: 8,
              backgroundColor: '#ff3b30',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="stop" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim()}
            style={{
              marginLeft: 8,
              backgroundColor: input.trim() ? COLORS.accent : COLORS.muted,
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '600' }}>Conversaciones</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => switchConversation(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                    backgroundColor: item.id === conversation.id ? COLORS.card : 'transparent',
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.muted} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                      {new Date(item.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {item.id === conversation.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
            />
            <TouchableOpacity
              onPress={createNew}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={{ color: COLORS.accent, fontSize: 15, fontWeight: '600' }}>Nueva conversación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}
