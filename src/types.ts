export interface Contact {
  id: number;
  name: string;
  emails: string[];
  phoneNumbers: string[];
  company: string;
  address: string;
  birthday: string;
  tags: string[];
  groups: string[];
  notes: string;
  isFavorite: boolean;
  dateAdded: string;
  lastModified: string;
  interactionCount: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Analytics {
  totalContacts: number;
  favoritePercentage: number;
  favoritesCount: number;
  monthlyAdditions: { name: string; count: number }[];
  companyDistribution: { name: string; value: number }[];
  undoQueueSize: number;
}

export type SortField = 'name' | 'company' | 'birthday' | 'dateAdded' | 'lastModified';
export type FilterGroup = 'all' | 'favorites' | 'byGroup' | 'byTag' | 'byCompany';
export type ActiveTab = 'contacts' | 'dsa-explorer' | 'analytics' | 'relationships';
export type Theme = 'dark' | 'light';
