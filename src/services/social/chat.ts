import { supabase } from '../../lib/supabase';
import type {
  ChatAttachmentType,
  ChatMessage,
  ChatMessagePin,
  ChatMessageReaction,
  ChatMessageReport,
  SocialTarget
} from '../../types';
import { isMissingDatabaseShapeError } from './helpers';

export async function fetchChatMessages(userId: string) {
  return supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_type', 'direct')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: true })
    .limit(300)
    .returns<ChatMessage[]>();
}

export async function fetchChatMessageMeta(messageIds: number[]) {
  if (!messageIds.length) {
    return {
      data: {
        reactions: [] as ChatMessageReaction[],
        pins: [] as ChatMessagePin[],
        reports: [] as ChatMessageReport[]
      },
      error: null
    };
  }

  const [reactionsRes, pinsRes, reportsRes] = await Promise.all([
    supabase.from('chat_message_reactions').select('*').in('message_id', messageIds).returns<ChatMessageReaction[]>(),
    supabase.from('chat_message_pins').select('*').in('message_id', messageIds).returns<ChatMessagePin[]>(),
    supabase.from('chat_message_reports').select('*').in('message_id', messageIds).returns<ChatMessageReport[]>()
  ]);

  const firstError = [reactionsRes.error, pinsRes.error, reportsRes.error].find(error => error && !isMissingDatabaseShapeError(error));
  if (firstError) {
    return {
      data: {
        reactions: [] as ChatMessageReaction[],
        pins: [] as ChatMessagePin[],
        reports: [] as ChatMessageReport[]
      },
      error: firstError
    };
  }

  return {
    data: {
      reactions: reactionsRes.error ? [] : reactionsRes.data || [],
      pins: pinsRes.error ? [] : pinsRes.data || [],
      reports: reportsRes.error ? [] : reportsRes.data || []
    },
    error: null
  };
}

export async function uploadChatMedia(userId: string, file: File) {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeBase = file.name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'arquivo';
  const path = `${userId}/${Date.now()}-${safeBase}.${extension}`;
  const uploadRes = await supabase.storage.from('chat-media').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false
  });
  if (uploadRes.error) return { data: null, error: uploadRes.error };

  const publicRes = supabase.storage.from('chat-media').getPublicUrl(path);
  return {
    data: {
      url: publicRes.data.publicUrl,
      name: file.name,
      type: attachmentTypeFromMime(file.type)
    },
    error: null
  };
}

export function attachmentTypeFromMime(mimeType: string): ChatAttachmentType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

export async function sendChatMessage(payload: {
  senderId: string;
  target: SocialTarget;
  body: string;
  attachmentUrl?: string;
  attachmentType?: ChatAttachmentType;
  attachmentName?: string;
  replyToMessageId?: number | null;
}) {
  const base = {
    sender_id: payload.senderId,
    body: payload.body.trim() || (payload.attachmentUrl ? 'Anexo' : ''),
    attachment_url: payload.attachmentUrl || '',
    attachment_type: payload.attachmentType || 'none',
    attachment_name: payload.attachmentName || '',
    ...(payload.replyToMessageId ? { reply_to_message_id: payload.replyToMessageId } : {})
  };

  const row: Record<string, unknown> = payload.target.type === 'direct'
    ? { ...base, conversation_type: 'direct', receiver_id: payload.target.id, group_id: null, server_channel_id: null }
    : payload.target.type === 'group'
      ? { ...base, conversation_type: 'group', receiver_id: null, group_id: payload.target.id, server_channel_id: null }
      : { ...base, conversation_type: 'server_channel', receiver_id: null, group_id: null, server_channel_id: payload.target.id };

  const insertRes = await supabase.from('chat_messages').insert(row).select().single<ChatMessage>();
  if (insertRes.error && isMissingDatabaseShapeError(insertRes.error) && 'reply_to_message_id' in row) {
    delete row.reply_to_message_id;
    return supabase.from('chat_messages').insert(row).select().single<ChatMessage>();
  }

  return insertRes;
}

export async function deleteChatMessage(messageId: number) {
  return supabase.from('chat_messages').delete().eq('id', messageId);
}

export async function addMessageReaction(messageId: number, userId: string, emoji: string) {
  return supabase
    .from('chat_message_reactions')
    .upsert({ message_id: messageId, user_id: userId, emoji }, { onConflict: 'message_id,user_id,emoji', ignoreDuplicates: true });
}

export async function pinChatMessage(messageId: number, userId: string) {
  return supabase
    .from('chat_message_pins')
    .upsert({ message_id: messageId, pinned_by: userId }, { onConflict: 'message_id' })
    .select()
    .single<ChatMessagePin>();
}

export async function unpinChatMessage(messageId: number) {
  return supabase.from('chat_message_pins').delete().eq('message_id', messageId);
}

export async function reportChatMessage(messageId: number, reporterId: string, reason: string) {
  const insertRes = await supabase
    .from('chat_message_reports')
    .insert({ message_id: messageId, reporter_id: reporterId, reason });

  if (insertRes.error?.code === '23505') return { data: null, error: null };
  return insertRes;
}
