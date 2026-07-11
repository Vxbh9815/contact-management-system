import React, { useState, useEffect, useRef } from 'react';
import { 
  Contact, User, Analytics, SortField, FilterGroup, ActiveTab, Theme 
} from './types';
import { 
  Users, Star, Tag, Undo2, Upload, Download, Search, Plus, Trash2, Edit, 
  LayoutDashboard, Menu, X, Moon, Sun, LogOut, MapPin, Calendar, Building, 
  MessageSquare, Sparkles, LineChart, BookOpen, Binary, UserPlus, 
  FileCode, CheckCircle, AlertTriangle, ShieldCheck, Mail, Phone, ChevronRight, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import DSAVisualizer from './components/DSAVisualizer';

export default function App() {
  // --- STATE SYSTEM ---
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('contacts');
  
  // API Core Arrays
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [favorites, setFavorites] = useState<Contact[]>([]);
  const [recentViews, setRecentViews] = useState<Contact[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Authentication Forms
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Search, Sort, Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [filterGroup, setFilterGroup] = useState<FilterGroup>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  
  // Modals & Forms
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Contact Form Fields
  const [formName, setFormName] = useState('');
  const [formEmails, setFormEmails] = useState('');
  const [formPhones, setFormPhones] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBirthday, setFormBirthday] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formGroups, setFormGroups] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsFavorite, setFormIsFavorite] = useState(false);
  const [formError, setFormError] = useState('');

  // CSV Import State
  const [importCsvString, setImportCsvString] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Relationship Tab graph states
  const [selectedGraphContact, setSelectedGraphContact] = useState<Contact | null>(null);
  const [relatedContacts, setRelatedContacts] = useState<Contact[]>([]);

  // Toast Alerts System
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info'; hasUndo?: boolean }[]>([]);
  
  // Mobile Nav Drawer
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // File explorer references
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- THEME SYNC ---
  useEffect(() => {
    const localTheme = localStorage.getItem('crm_theme') as Theme || 'dark';
    setTheme(localTheme);
    if (localTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('crm_theme', nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  // --- AUTOMATED SESSION RECOVERY ---
  useEffect(() => {
    const storedUser = localStorage.getItem('crm_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // Direct logging of mock user to make dashboard instant and accessible
      const defaultUser = { id: 1, username: "demo_user", email: "demo@example.com" };
      setCurrentUser(defaultUser);
    }
  }, []);

  // --- DATA SYNC ON LOGIN/TAB-CHANGE ---
  useEffect(() => {
    if (currentUser) {
      fetchContacts();
      fetchFavorites();
      fetchRecentViews();
      fetchAnalytics();
    }
  }, [currentUser, sortBy]);

  // --- TOAST TRIGGER ---
  const showToast = (message: string, type: 'success' | 'error' | 'info', hasUndo: boolean = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, hasUndo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // --- REST CLIENT CALLS ---
  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/contacts/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentViews = async () => {
    try {
      const res = await fetch('/api/contacts/recent');
      if (res.ok) {
        const data = await res.json();
        setRecentViews(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trie Search Suggestions on Autocomplete
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
          }
        } catch (e) {
          console.error(e);
        }
      }, 200);
      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  // View specific contact details (Triggers LIFO Stack viewed stack)
  const handleViewContact = async (id: number) => {
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (res.ok) {
        const contact = await res.json();
        showToast(`Opened ${contact.name}. Added to Recently Viewed stack (LIFO).`, 'info');
        fetchContacts(); // Update interaction counts
        fetchRecentViews();
        fetchFavorites();
        fetchAnalytics();

        // If currently in Relationship tab, trigger relative graph lookup
        if (activeTab === 'relationships') {
          handleSelectGraphContact(contact);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle favorite trigger (Heap Priority rebalance)
  const handleToggleFavorite = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/contacts/favorite/${id}`, { method: 'POST' });
      if (res.ok) {
        showToast('Updated Favorite ranking heap index', 'success');
        fetchContacts();
        fetchFavorites();
        fetchAnalytics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REST Delete contact (pushes to FIFO Queue)
  const handleDeleteContact = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove ${name} from active directories?`)) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Contact ${name} deleted successfully.`, 'success', true);
        fetchContacts();
        fetchFavorites();
        fetchRecentViews();
        fetchAnalytics();
        
        if (selectedGraphContact?.id === id) {
          setSelectedGraphContact(null);
          setRelatedContacts([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REST Undo deletion (pop FIFO Queue head)
  const handleUndoDelete = async () => {
    try {
      const res = await fetch('/api/contacts/undo', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Restored contact: ${data.contact.name}`, 'success');
        fetchContacts();
        fetchFavorites();
        fetchAnalytics();
      } else {
        showToast(data.error || 'No deleted contacts left in the FIFO buffer!', 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // BFS Graph group query
  const handleSelectGraphContact = async (contact: Contact) => {
    setSelectedGraphContact(contact);
    try {
      const res = await fetch(`/api/contacts/related/${contact.id}`);
      if (res.ok) {
        const data = await res.json();
        setRelatedContacts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- CRUD FORM PROCESSING ---
  const handleOpenAddModal = () => {
    setEditingContact(null);
    setFormName('');
    setFormEmails('');
    setFormPhones('');
    setFormCompany('');
    setFormAddress('');
    setFormBirthday('');
    setFormTags('');
    setFormGroups('');
    setFormNotes('');
    setFormIsFavorite(false);
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingContact(contact);
    setFormName(contact.name);
    setFormEmails(contact.emails.join(', '));
    setFormPhones(contact.phoneNumbers.join(', '));
    setFormCompany(contact.company);
    setFormAddress(contact.address);
    setFormBirthday(contact.birthday);
    setFormTags(contact.tags.join(', '));
    setFormGroups(contact.groups.join(', '));
    setFormNotes(contact.notes);
    setFormIsFavorite(contact.isFavorite);
    setFormError('');
    setIsAddEditModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmails.trim() || !formPhones.trim()) {
      setFormError('Please fill out Name, at least one Email and one Phone Number.');
      return;
    }

    const emailsArr = formEmails.split(',').map(x => x.trim()).filter(Boolean);
    const phonesArr = formPhones.split(',').map(x => x.trim()).filter(Boolean);
    const tagsArr = formTags.split(',').map(x => x.trim()).filter(Boolean);
    const groupsArr = formGroups.split(',').map(x => x.trim()).filter(Boolean);

    const contactPayload = {
      name: formName.trim(),
      emails: emailsArr,
      phoneNumbers: phonesArr,
      company: formCompany.trim(),
      address: formAddress.trim(),
      birthday: formBirthday,
      tags: tagsArr,
      groups: groupsArr,
      notes: formNotes.trim(),
      isFavorite: formIsFavorite
    };

    try {
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactPayload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(editingContact ? 'Contact modified successfully!' : 'Contact added to directories!', 'success');
        setIsAddEditModalOpen(false);
        fetchContacts();
        fetchFavorites();
        fetchAnalytics();
      } else {
        setFormError(data.error || 'Failed to save contact. Duplicate emails or phone numbers detected.');
      }
    } catch (e: any) {
      setFormError('Network communication error.');
    }
  };

  // --- CSV ACTIONS ---
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCsvString.trim()) return;

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: importCsvString })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`CSV bulk import finished! Imported ${data.imported} contacts.`, 'success');
        setIsImportModalOpen(false);
        setImportCsvString('');
        fetchContacts();
        fetchFavorites();
        fetchAnalytics();
      } else {
        showToast(data.error || 'Failed to parse CSV.', 'error');
      }
    } catch (e) {
      showToast('CSV communication failure.', 'error');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/contacts/export', '_blank');
  };

  // --- AUTH ACTIONS ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername || !authPassword || (isRegisterMode && !authEmail)) {
      setAuthError('Please fill out all credentials');
      return;
    }

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegisterMode 
        ? { username: authUsername, email: authEmail, password: authPassword }
        : { usernameOrEmail: authUsername, password: authPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(isRegisterMode ? 'Registration complete!' : 'Welcome back to the System!', 'success');
        const loggedUser = isRegisterMode ? data.user : data.user;
        setCurrentUser(loggedUser);
        localStorage.setItem('crm_user', JSON.stringify(loggedUser));
        setAuthUsername('');
        setAuthEmail('');
        setAuthPassword('');
      } else {
        setAuthError(data.error || 'Authorization invalid.');
      }
    } catch (e) {
      setAuthError('Error communicating with authentication server.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm_user');
    showToast('Signed out successfully.', 'info');
  };

  // --- FILTERED CONTACTS SELECTOR ---
  const getFilteredContacts = () => {
    return contacts.filter(c => {
      // Freeform string search
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (c.company || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Filter selections
      if (filterGroup === 'favorites') return c.isFavorite;
      if (filterGroup === 'byCompany' && filterValue) return c.company === filterValue;
      if (filterGroup === 'byTag' && filterValue) return c.tags.includes(filterValue);
      if (filterGroup === 'byGroup' && filterValue) return c.groups.includes(filterValue);
      
      return true;
    });
  };

  // Gather unique tags, groups, companies for filters
  const uniqueCompanies = Array.from(new Set(contacts.map(c => c.company).filter(Boolean)));
  const uniqueTags = Array.from(new Set(contacts.flatMap(c => c.tags).filter(Boolean)));
  const uniqueGroups = Array.from(new Set(contacts.flatMap(c => c.groups).filter(Boolean)));

  const filteredContacts = getFilteredContacts();

  // --- RENDER SCREEN ---
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
        <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl p-8 bg-slate-900/40 backdrop-blur-md relative z-10 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-2">
              <Binary className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-slate-100">
              {isRegisterMode ? 'Deploy New Database' : 'C++ Algorithmic CRM'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              A high-performance system fueled by manual C++17/20 structural designs and balanced nodes.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Username or Email</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. demo_user"
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500 transition-all font-mono"
                />
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. hello@example.com"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500 transition-all font-mono"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Secret Key / Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500 transition-all font-mono"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all font-mono flex items-center justify-center gap-2"
            >
              {isRegisterMode ? 'Register & Spin Engine' : 'Authenticate & Open Directory'}
            </button>
          </form>

          {/* Quick seeded demo user assistance banner */}
          {!isRegisterMode && (
            <div className="p-3.5 bg-sky-500/5 border border-sky-500/15 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                DEMO CREDENTIALS LOADED
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Use username <span className="font-mono font-bold text-slate-200">demo_user</span> and password <span className="font-mono font-bold text-slate-200">Password123</span> to bypass and explore pre-seeded AVL database indices.
              </p>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError('');
              }}
              className="text-xs text-sky-400 hover:underline font-mono"
            >
              {isRegisterMode ? 'Already have an database? Login' : 'Need a new account? Register'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${theme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-200'}`}>
      
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full bg-sky-500/5 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[150px]" />
      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-white/5 bg-slate-900/85 backdrop-blur-md sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2.5">
          <Binary className="text-sky-400 w-5 h-5" />
          <h1 className="text-sm font-bold tracking-tight text-slate-100 font-display uppercase">Contact Management System</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="p-1.5 rounded-lg text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={`w-64 bg-[#0c1220]/95 md:bg-[#0c1220]/45 border-r border-white/10 dark:border-white/5 py-6 px-4 flex flex-col justify-between fixed md:sticky top-0 h-full z-40 md:z-10 transition-transform duration-300 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-2">
              <div className="p-2 bg-sky-500/15 border border-sky-500/30 rounded-xl text-sky-400">
                <Binary className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-100 font-display">Contact Management System</h1>
                <p className="text-[9px] text-sky-400 font-mono tracking-widest font-bold uppercase">C++ Engine Active</p>
              </div>
            </div>
            <button className="md:hidden text-slate-400" onClick={() => setIsMobileNavOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Session Profile */}
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs font-mono">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-slate-200 truncate">{currentUser.username}</h4>
              <p className="text-[9px] text-slate-400 truncate font-mono">{currentUser.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'contacts', label: 'Directory', icon: Users },
              { id: 'relationships', label: 'Connections Graph', icon: BookOpen },
              { id: 'dsa-explorer', label: 'DSA Visualizer', icon: FileCode },
              { id: 'analytics', label: 'CRM Analytics', icon: LineChart }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as ActiveTab);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-md shadow-sky-500/5' 
                      : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel Actions */}
        <div className="space-y-3 pt-6 border-t border-white/5">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs transition-all border border-transparent hover:border-white/5 font-mono"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
              <span>Theme Color</span>
            </div>
            <span className="text-[10px] font-bold uppercase opacity-75">{theme}</span>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs transition-all border border-transparent hover:border-red-500/5 font-mono"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Database</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-x-hidden relative z-10 w-full max-w-7xl mx-auto">
        
        {/* TOP COMPILER STATUS HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-100 flex items-center gap-2">
              {activeTab === 'contacts' && 'Directories Grid'}
              {activeTab === 'relationships' && 'Group Connection Network'}
              {activeTab === 'dsa-explorer' && 'C++ DSA Struct Visualizer'}
              {activeTab === 'analytics' && 'CRM Analytics Charts'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Workspace root: <span className="text-sky-400">/backend/algorithms/</span> • Standard C++20 Standard
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Global Undo Deletions Action */}
            <button
              onClick={handleUndoDelete}
              className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all font-mono"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo Delete
            </button>

            {/* Quick Add Contact */}
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/15 flex items-center gap-2 transition-all font-mono"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
        </div>

        {/* VIEW 2: CONTACT DIRECTORY */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            
            {/* SEARCH, SORT, AND FILTERS BAR */}
            <div className="glass shadow-xl rounded-2xl p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
              
              {/* Auto-suggest Search */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search contact index via Trie Prefix lookup..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-sky-500 transition-all font-mono"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  
                  {/* Trie Autocomplete Suggestion Dropdown */}
                  <AnimatePresence>
                    {suggestions.length > 0 && searchQuery.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-12 bg-slate-900/95 border border-white/10 rounded-2xl p-3 z-50 shadow-2xl max-h-60 overflow-y-auto space-y-1 backdrop-blur-lg"
                      >
                        <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider font-mono px-2 mb-1.5 flex items-center gap-1">
                          <Binary className="w-3.5 h-3.5" />
                          Trie Prefix Completion Matches
                        </div>
                        {suggestions.map(sug => (
                          <div
                            key={sug.id}
                            onClick={() => {
                              handleViewContact(sug.id);
                              setSearchQuery(sug.name);
                              setSuggestions([]);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all"
                          >
                            <span className="text-xs text-slate-100 font-semibold">{sug.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded-full">
                              {sug.company || 'Index'}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Sorting Field Selector */}
                <div className="flex gap-2">
                  <div className="flex items-center bg-white/5 px-3 py-2 rounded-xl border border-white/10 gap-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as SortField)}
                      className="bg-transparent border-none text-xs text-slate-200 outline-none cursor-pointer font-semibold font-mono"
                    >
                      <option value="name" className="bg-slate-900">Alphabetical</option>
                      <option value="company" className="bg-slate-900">Company</option>
                      <option value="birthday" className="bg-slate-900">Birthday</option>
                      <option value="dateAdded" className="bg-slate-900">Date Added</option>
                      <option value="lastModified" className="bg-slate-900">Modified</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Structural Filters tabs */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => { setFilterGroup('all'); setFilterValue(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${filterGroup === 'all' ? 'bg-sky-500 text-white font-bold' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}
                >
                  All Active
                </button>
                <button
                  onClick={() => { setFilterGroup('favorites'); setFilterValue(''); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 ${filterGroup === 'favorites' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-white/5 text-slate-400 hover:text-slate-200'}`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Favorites
                </button>

                {/* Filter by Company */}
                {uniqueCompanies.length > 0 && (
                  <div className={`px-2 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${filterGroup === 'byCompany' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-white/5 border-transparent text-slate-400'}`}>
                    <span>Company:</span>
                    <select
                      value={filterGroup === 'byCompany' ? filterValue : ''}
                      onChange={e => { setFilterGroup('byCompany'); setFilterValue(e.target.value); }}
                      className="bg-transparent border-none text-xs text-slate-200 outline-none cursor-pointer font-bold"
                    >
                      <option value="" className="bg-slate-900">Select...</option>
                      {uniqueCompanies.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                    </select>
                  </div>
                )}

                {/* Filter by Tag */}
                {uniqueTags.length > 0 && (
                  <div className={`px-2 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${filterGroup === 'byTag' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-white/5 border-transparent text-slate-400'}`}>
                    <span>Tag:</span>
                    <select
                      value={filterGroup === 'byTag' ? filterValue : ''}
                      onChange={e => { setFilterGroup('byTag'); setFilterValue(e.target.value); }}
                      className="bg-transparent border-none text-xs text-slate-200 outline-none cursor-pointer font-bold"
                    >
                      <option value="" className="bg-slate-900">Select...</option>
                      {uniqueTags.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                    </select>
                  </div>
                )}

                {/* Filter by Group */}
                {uniqueGroups.length > 0 && (
                  <div className={`px-2 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${filterGroup === 'byGroup' ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-white/5 border-transparent text-slate-400'}`}>
                    <span>Group:</span>
                    <select
                      value={filterGroup === 'byGroup' ? filterValue : ''}
                      onChange={e => { setFilterGroup('byGroup'); setFilterValue(e.target.value); }}
                      className="bg-transparent border-none text-xs text-slate-200 outline-none cursor-pointer font-bold"
                    >
                      <option value="" className="bg-slate-900">Select...</option>
                      {uniqueGroups.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* DIRECTORY LIST SPREADSHEET CARD */}
            <div className="glass shadow-2xl rounded-3xl border border-white/10 dark:border-white/5 bg-slate-950/15 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/40 text-slate-400 font-mono text-[10px]">
                      <th className="py-3 px-6 font-semibold">Contact Node</th>
                      <th className="py-3 px-6 font-semibold">Company</th>
                      <th className="py-3 px-6 font-semibold">Emails</th>
                      <th className="py-3 px-6 font-semibold">Phone Numbers</th>
                      <th className="py-3 px-6 font-semibold">Tags / Groups</th>
                      <th className="py-3 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((c, idx) => (
                      <tr 
                        key={c.id}
                        onClick={() => handleViewContact(c.id)}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all group"
                      >
                        {/* Name Column */}
                        <td className="py-4 px-6 font-semibold text-slate-100 flex items-center gap-3">
                          <button
                            onClick={(e) => handleToggleFavorite(c.id, e)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-500 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${c.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                          </button>
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 font-bold text-sky-400 flex items-center justify-center text-xs">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-slate-100 font-bold font-display block">{c.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">ID: {c.id}</span>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="py-4 px-6 text-slate-300">
                          {c.company ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                              <Building className="w-3 h-3 text-slate-400" />
                              {c.company}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono text-[10px]">Individual</span>
                          )}
                        </td>

                        {/* Emails */}
                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {c.emails.map((e, i) => (
                            <div key={i} className="text-[11px] leading-tight">{e}</div>
                          ))}
                        </td>

                        {/* Phones */}
                        <td className="py-4 px-6 text-slate-400 font-mono">
                          {c.phoneNumbers.map((p, i) => (
                            <div key={i} className="text-[11px] leading-tight">{p}</div>
                          ))}
                        </td>

                        {/* Tags and Groups */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {c.tags.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] text-slate-300 font-mono border border-white/5">
                                {t}
                              </span>
                            ))}
                            {c.groups.map(g => (
                              <span key={g} className="px-2 py-0.5 bg-sky-500/10 rounded-full text-[9px] text-sky-400 font-mono border border-sky-500/20">
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleOpenEditModal(c, e)}
                              className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-400 rounded-lg transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteContact(c.id, c.name, e)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                          No indices matched the search filters. Try resetting company or tags.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: RELATIONSHIPS GRAPH BFS LOOKUP */}
        {activeTab === 'relationships' && (
          <div className="space-y-6">
            <div className="glass shadow-xl rounded-2xl p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <Users className="text-sky-400 w-4 h-4" />
                Network Connections & Shared Workgroups Explorer (BFS)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Choose an active contact vertex below to trace shared workgroups relationships. The backend maps connections in an undirected, unweighted Graph adjacency matrix and explores colleagues via step-by-step **Breadth-First Search (BFS)** traversal algorithms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Contact Picker */}
              <div className="md:col-span-1 glass shadow-lg rounded-2xl p-4.5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Select Start Vertex</span>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contacts.map(c => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectGraphContact(c)}
                      className={`p-3 rounded-xl cursor-pointer text-xs transition-all border ${
                        selectedGraphContact?.id === c.id 
                          ? 'bg-sky-500/15 border-sky-500/50 text-slate-200' 
                          : 'bg-white/5 border-transparent hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{c.name}</div>
                      <div className="text-[10px] text-slate-400">{c.groups.join(', ') || 'No groups assigned'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right BFS Connections View */}
              <div className="md:col-span-2 glass shadow-lg rounded-3xl p-6 border border-white/10 dark:border-white/5 bg-slate-950/20 backdrop-blur-md flex flex-col justify-center min-h-[300px]">
                {selectedGraphContact ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-sky-500/10 border border-sky-500/25 rounded-2xl">
                      <div className="w-11 h-11 bg-sky-500 rounded-xl text-slate-950 font-bold flex items-center justify-center text-lg font-mono">
                        {selectedGraphContact.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{selectedGraphContact.name}</h4>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {selectedGraphContact.groups.map(g => (
                            <span key={g} className="px-2 py-0.5 bg-sky-500/20 rounded-full text-[9px] text-sky-400 border border-sky-500/30 font-mono">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">
                        Colleagues Connected in Graph Adjacency List ({relatedContacts.length})
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {relatedContacts.map(rel => (
                          <div 
                            key={rel.id}
                            onClick={() => handleViewContact(rel.id)}
                            className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all flex items-center gap-2.5"
                          >
                            <div className="w-7 h-7 bg-white/10 rounded-lg text-slate-300 font-bold text-xs flex items-center justify-center">
                              {rel.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-slate-200 truncate">{rel.name}</h5>
                              <p className="text-[10px] text-slate-500 truncate">{rel.company || 'Private'}</p>
                            </div>
                          </div>
                        ))}

                        {relatedContacts.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-slate-500 text-xs font-mono">
                            This contact shares no groups with other active directory nodes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2 p-8">
                    <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-300">Choose a starting contact</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Select a contact vertex from the left column to run the manual BFS traversal and map their organizational network.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: DSA VISUALIZER PLAYGROUND */}
        {activeTab === 'dsa-explorer' && (
          <DSAVisualizer 
            contacts={contacts} 
            recentViews={recentViews} 
            undoQueueSize={analytics?.undoQueueSize || 0} 
          />
        )}

        {/* VIEW 5: CRM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Charts section */}
            {analytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Monthly Additions Area Chart */}
                <div className="glass shadow-xl rounded-2xl p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">Monthly Addition Frequency</h3>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">Dynamic</span>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.monthlyAdditions || []}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontStyle="italic" />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Company Distribution Bar Chart */}
                <div className="glass shadow-xl rounded-2xl p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">Company Volume Nodes</h3>
                    <span className="text-[9px] text-sky-400 font-mono font-bold">Adjacency</span>
                  </div>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.companyDistribution || []}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {analytics.companyDistribution?.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#10b981' : '#059669'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center font-mono text-xs text-slate-500">
                Analytics engine seeding. Ensure contacts list is compiled.
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- MODAL: ADD / EDIT CONTACT --- */}
      <AnimatePresence>
        {isAddEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl p-6 bg-slate-900/90 relative max-h-[90vh] overflow-y-auto space-y-5 text-slate-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-display text-slate-100">
                  {editingContact ? 'Edit Contact Directory Node' : 'Add New Contact Directory Node'}
                </h3>
                <button 
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2 font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveContact} className="space-y-4 text-xs font-mono">
                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Marie Curie"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                      required
                    />
                  </div>

                  {/* Company */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Workspace Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Radium Labs"
                      value={formCompany}
                      onChange={e => setFormCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    />
                  </div>
                </div>

                {/* Emails (multiple, comma separated) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Email Addresses * (comma-separated for multiples)</label>
                  <input
                    type="text"
                    placeholder="e.g. marie@labs.org, curie@gmail.com"
                    value={formEmails}
                    onChange={e => setFormEmails(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    required
                  />
                </div>

                {/* Phones (multiple, comma separated) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Phone Numbers * (comma-separated for multiples)</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 019-3211, +1 (555) 019-4452"
                    value={formPhones}
                    onChange={e => setFormPhones(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    required
                  />
                </div>

                {/* Address & Birthday */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Paris, France"
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Birthday Date</label>
                    <input
                      type="date"
                      value={formBirthday}
                      onChange={e => setFormBirthday(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    />
                  </div>
                </div>

                {/* Tags & Groups */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Researcher, NoblePrize"
                      value={formTags}
                      onChange={e => setFormTags(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Workspace Groups (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Academic Circles, Europe Network"
                      value={formGroups}
                      onChange={e => setFormGroups(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Interactive Notes</label>
                  <textarea
                    placeholder="Add text notes about interactions with this contact node..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-sky-500 text-slate-100 h-20 resize-none"
                  />
                </div>

                {/* Favorite toggle */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="formIsFavorite"
                    checked={formIsFavorite}
                    onChange={e => setFormIsFavorite(e.target.checked)}
                    className="w-4.5 h-4.5 accent-amber-500 rounded border-white/10 bg-white/5"
                  />
                  <label htmlFor="formIsFavorite" className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    Star as Priority Favorite Contact (Max-Heap index)
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAddEditModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/15"
                  >
                    {editingContact ? 'Apply Nodes' : 'Index Node'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: CSV BULK IMPORT --- */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass border border-white/10 dark:border-white/5 shadow-2xl rounded-3xl p-6 bg-slate-900/90 relative space-y-4 text-slate-200"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold font-display text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  Import CSV Nodes spreadsheet
                </h3>
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleImportCSV} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Raw CSV Data (Comma separated, Semicolon separated list elements)</label>
                  <textarea
                    placeholder='name,emails,phoneNumbers,company,address,birthday,tags,groups,notes,isFavorite&#10;"Alan Turing","turing@manchester.edu","+15551234","Enigma","Bletchley Park, UK","1912-06-23","AI;Code","Silicon Valley Network","Hero of cryptography",1'
                    value={importCsvString}
                    onChange={e => setImportCsvString(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-mono outline-none focus:border-emerald-500 text-slate-200 h-48"
                    required
                  />
                </div>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    CSV SCHEMA BLUEPRINT
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Format: <span className="text-slate-300">name,emails,phoneNumbers,company,address,birthday,tags,groups,notes,isFavorite</span>. Multi-valued emails/phones/tags/groups must be joined with a semicolon (<span className="font-bold font-mono">;</span>) character.
                  </p>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/15"
                  >
                    Index Bulk CSV
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FLOATING TOASTS PANEL --- */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 pointer-events-auto border backdrop-blur-md ${
              t.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' 
                : t.type === 'error' 
                ? 'bg-red-950/90 border-red-500/30 text-red-200' 
                : 'bg-slate-900/95 border-sky-500/30 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {t.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0" />}
              {t.type === 'info' && <Sparkles className="w-4.5 h-4.5 text-sky-400 shrink-0" />}
              <span>{t.message}</span>
            </div>
            {t.hasUndo && (
              <button
                onClick={() => {
                  handleUndoDelete();
                  setToasts(prev => prev.filter(x => x.id !== t.id));
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold rounded-lg font-mono shrink-0 shadow-sm"
              >
                Undo Last Action
              </button>
            )}
          </motion.div>
        ))}
      </div>

    </div>
  );
}
