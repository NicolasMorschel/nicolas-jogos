import type { Session, User } from '@supabase/supabase-js';

export type Genre =
  | 'acao-aventura'
  | 'mundo-aberto'
  | 'survival-horror'
  | 'fps'
  | 'esporte'
  | 'rpg';

export type Role = 'user' | 'admin';
export type Status = 'active' | 'blocked';
export type ViewId = 'storeView' | 'libraryView' | 'cartView' | 'checkoutView' | 'adminView' | 'profileView' | 'socialView';
export type AdminTab = 'users' | 'library' | 'catalog' | 'home';
export type PaymentMethod = 'pix' | 'debito' | 'credito';
export type QuickFilter = 'all' | 'featured' | 'discount' | 'favorites';
export type GameRestrictionType = 'warning' | 'temporary_ban' | 'permanent_ban';
export type GameRestrictionDuration = '24h' | '7d' | '30d';
export type LibraryDisplayMode = 'cards' | 'table';
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type ProfileTab = 'overview' | 'library' | 'favorites' | 'friends' | 'restrictions' | 'edit';
export type SocialSpace = 'direct' | 'group' | 'server';
export type ChatConversationType = 'direct' | 'group' | 'server_channel';
export type ChatAttachmentType = 'none' | 'image' | 'video' | 'audio' | 'file';
export type CommunityChannelType = 'text' | 'voice';

export type Game = {
  id: number;
  title: string;
  franchise: string;
  genre: Genre | string;
  price: number;
  old_price: number;
  discount: number;
  featured: boolean;
  description: string;
  tags: string[];
};

export type Profile = {
  id: string;
  name: string;
  role: Role;
  status: Status;
  avatar_url: string;
  banner_url: string;
  bio: string;
  created_at: string;
};

export type AdminUser = Profile & {
  email: string;
  library_count: number;
};

export type LibraryItem = {
  game_id: number;
  source?: 'purchase' | 'admin_grant' | string | null;
};

export type GameRestriction = {
  id: number;
  user_id: string;
  game_id: number;
  restriction_type: GameRestrictionType;
  reason: string;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
};

export type GameRestrictionForm = {
  gameId: string;
  type: GameRestrictionType;
  duration: GameRestrictionDuration;
  reason: string;
};

export type PublicProfile = {
  id: string;
  name: string;
  avatar_url: string;
  banner_url: string;
  bio: string;
  created_at: string;
};

export type Friendship = {
  id: number;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type UserReport = {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string;
  status: 'open' | 'reviewed' | 'dismissed';
  created_at: string;
};

export type ProfileComment = {
  id: number;
  profile_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type GamePlayStats = {
  user_id: string;
  game_id: number;
  minutes_played: number;
  launch_count: number;
  last_played_at: string | null;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  sender_id: string;
  receiver_id: string | null;
  conversation_type: ChatConversationType;
  group_id: number | null;
  server_channel_id: number | null;
  reply_to_message_id: number | null;
  body: string;
  attachment_url: string;
  attachment_type: ChatAttachmentType;
  attachment_name: string;
  created_at: string;
  read_at: string | null;
};

export type ChatMessageReaction = {
  id: number;
  message_id: number;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type ChatMessagePin = {
  message_id: number;
  pinned_by: string;
  created_at: string;
};

export type ChatMessageReport = {
  id: number;
  message_id: number;
  reporter_id: string;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed';
  created_at: string;
};

export type ChatGroup = {
  id: number;
  owner_id: string;
  name: string;
  avatar_url: string;
  created_at: string;
};

export type ChatGroupMember = {
  group_id: number;
  user_id: string;
  member_role: 'owner' | 'moderator' | 'member';
  joined_at: string;
};

export type CommunityServer = {
  id: number;
  owner_id: string;
  name: string;
  icon_url: string;
  description: string;
  visibility: 'private' | 'public';
  invite_code: string;
  created_at: string;
};

export type CommunityServerMember = {
  server_id: number;
  user_id: string;
  nickname: string;
  joined_at: string;
};

export type CommunityRole = {
  id: number;
  server_id: number;
  name: string;
  color: string;
  position: number;
  can_manage_server: boolean;
  can_manage_channels: boolean;
  can_manage_roles: boolean;
  can_moderate_voice?: boolean;
  created_at: string;
};

export type CommunityMemberRole = {
  server_id: number;
  user_id: string;
  role_id: number;
  created_at: string;
};

export type CommunityChannel = {
  id: number;
  server_id: number;
  name: string;
  channel_type: CommunityChannelType;
  position: number;
  created_at: string;
};

export type CommunityVoicePresence = {
  channel_id: number;
  user_id: string;
  joined_at: string;
};

export type SocialTarget =
  | { type: 'direct'; id: string }
  | { type: 'group'; id: number }
  | { type: 'server_channel'; id: number };

export type CreateGroupForm = {
  name: string;
  memberIds: string[];
};

export type CreateServerForm = {
  name: string;
  description: string;
};

export type CreateChannelForm = {
  name: string;
  type: CommunityChannelType;
};

export type CreateRoleForm = {
  name: string;
  color: string;
};

export type ProfileForm = {
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  email: string;
};

export type PasswordForm = {
  password: string;
  confirmPassword: string;
};

export type ReportForm = {
  reportedUserId: string;
  reason: string;
  details: string;
};

export type SavedCard = {
  id: number;
  user_id: string;
  brand: string;
  last4: string;
  holder_name: string;
  created_at: string;
};

export type StoreConfig = {
  carousel: number[];
  promo_title: string;
  promo_text: string;
};

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
};

export type GameForm = {
  title: string;
  franchise: string;
  genre: Genre;
  price: string;
  oldPrice: string;
  discount: string;
  hasDiscount: boolean;
  featured: boolean;
  tags: string;
  description: string;
};

export type CardForm = {
  name: string;
  number: string;
  date: string;
  cvv: string;
  save: boolean;
};

export type FranchiseSummary = {
  name: string;
  count: number;
};
