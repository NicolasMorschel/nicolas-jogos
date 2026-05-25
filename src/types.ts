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
export type ViewId = 'storeView' | 'libraryView' | 'cartView' | 'checkoutView' | 'adminView';
export type AdminTab = 'users' | 'library' | 'catalog' | 'home';
export type PaymentMethod = 'pix' | 'debito' | 'credito';
export type QuickFilter = 'all' | 'featured' | 'discount' | 'favorites';

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
