import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { 
  GitFork, Search, Hash, Layers, ShieldAlert, Users2, HelpCircle, 
  ArrowRight, RefreshCw, Layers2, Award, Network, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DSAVisualizerProps {
  contacts: Contact[];
  recentViews: Contact[];
  undoQueueSize: number;
}

type DSAType = 'avl' | 'trie' | 'hash' | 'graph' | 'stack' | 'queue' | 'priority_queue';

export default function DSAVisualizer({ contacts, recentViews, undoQueueSize }: DSAVisualizerProps) {
  const [activeDSA, setActiveDSA] = useState<DSAType>('avl');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bfsResult, setBfsResult] = useState<number[]>([]);
  const [dfsResult, setDfsResult] = useState<number[]>([]);
  const [animatingNode, setAnimatingNode] = useState<number | null>(null);

  // Clear selections when structure changes
  useEffect(() => {
    setSelectedNode(null);
    setBfsResult([]);
    setDfsResult([]);
    setAnimatingNode(null);
  }, [activeDSA]);

  // --- 1. SIMULATE AVL TREE STRUCTURING ---
  interface AVLNode {
    key: string;
    contact: Contact;
    height: number;
    left: AVLNode | null;
    right: AVLNode | null;
    x?: number;
    y?: number;
  }

  const buildAVLTree = (): AVLNode | null => {
    if (contacts.length === 0) return null;

    const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name));

    // Helper to build balanced BST recursively (simulates perfect AVL balancing)
    const buildBalanced = (start: number, end: number): AVLNode | null => {
      if (start > end) return null;
      const mid = Math.floor((start + end) / 2);
      const contact = sorted[mid];
      
      const node: AVLNode = {
        key: contact.name,
        contact,
        height: 0,
        left: null,
        right: null
      };

      node.left = buildBalanced(start, mid - 1);
      node.right = buildBalanced(mid + 1, end);

      const leftHeight = node.left ? node.left.height : 0;
      const rightHeight = node.right ? node.right.height : 0;
      node.height = 1 + Math.max(leftHeight, rightHeight);

      return node;
    };

    return buildBalanced(0, sorted.length - 1);
  };

  // --- 2. SIMULATE TRIE PREFIX TREE ---
  interface TrieNode {
    char: string;
    isWord: boolean;
    ids: number[];
    children: { [key: string]: TrieNode };
  }

  const buildTrie = (): TrieNode => {
    const root: TrieNode = { char: '^', isWord: false, ids: [], children: {} };
    contacts.forEach(c => {
      let current = root;
      const name = c.name.toLowerCase();
      for (const char of name) {
        if (!current.children[char]) {
          current.children[char] = { char, isWord: false, ids: [], children: {} };
        }
        current = current.children[char];
        if (!current.ids.includes(c.id)) {
          current.ids.push(c.id);
        }
      }
      current.isWord = true;
    });
    return root;
  };

  // --- 3. SIMULATE GRAPH SOCIAL CONNECTIONS ---
  // Contacts sharing at least one workgroup have an edge
  const buildGraphEdges = () => {
    const edges: { source: number; target: number }[] = [];
    const nodeMap = new Map<number, Contact>();
    contacts.forEach(c => nodeMap.set(c.id, c));

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const c1 = contacts[i];
        const c2 = contacts[j];
        const common = c1.groups.some(g => c2.groups.includes(g));
        if (common) {
          edges.push({ source: c1.id, target: c2.id });
        }
      }
    }
    return edges;
  };

  // Run BFS on Graph
  const runBFS = (startId: number) => {
    const edges = buildGraphEdges();
    const adj: { [key: number]: number[] } = {};
    contacts.forEach(c => { adj[c.id] = []; });
    edges.forEach(e => {
      adj[e.source]?.push(e.target);
      adj[e.target]?.push(e.source);
    });

    const queue: number[] = [startId];
    const visited = new Set<number>([startId]);
    const result: number[] = [];

    const step = () => {
      if (queue.length === 0) {
        setBfsResult(result);
        setAnimatingNode(null);
        return;
      }
      const curr = queue.shift()!;
      result.push(curr);
      setAnimatingNode(curr);

      const neighbors = adj[curr] || [];
      neighbors.forEach(n => {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      });

      setTimeout(step, 600);
    };
    step();
  };

  // Run DFS on Graph
  const runDFS = (startId: number) => {
    const edges = buildGraphEdges();
    const adj: { [key: number]: number[] } = {};
    contacts.forEach(c => { adj[c.id] = []; });
    edges.forEach(e => {
      adj[e.source]?.push(e.target);
      adj[e.target]?.push(e.source);
    });

    const stack: number[] = [startId];
    const visited = new Set<number>();
    const result: number[] = [];

    const step = () => {
      if (stack.length === 0) {
        setDfsResult(result);
        setAnimatingNode(null);
        return;
      }
      const curr = stack.pop()!;
      if (!visited.has(curr)) {
        visited.add(curr);
        result.push(curr);
        setAnimatingNode(curr);

        const neighbors = adj[curr] || [];
        // Push in reverse to visit in order
        [...neighbors].reverse().forEach(n => {
          if (!visited.has(n)) {
            stack.push(n);
          }
        });
      }
      setTimeout(step, 600);
    };
    step();
  };

  // --- RENDER HEAP PRIORITY QUEUE TREE ---
  const favorites = contacts.filter(c => c.isFavorite).sort((a, b) => b.interactionCount - a.interactionCount);

  // --- DESCRIPTION METADATA ---
  const dsaMetadata: { [key in DSAType]: {
    title: string;
    icon: any;
    desc: string;
    timeComp: string;
    spaceComp: string;
    whyUsed: string;
    advantages: string;
  }} = {
    avl: {
      title: 'AVL Tree (Balanced Search Tree)',
      icon: GitFork,
      desc: 'Self-balancing Binary Search Tree where the heights of two child subtrees of any node differ by at most one.',
      timeComp: 'O(log N) for Search, Insert, and Delete',
      spaceComp: 'O(N) total node storage',
      whyUsed: 'Provides reliable, structured alphabetical indexing. While normal BSTs can degenerate into O(N) linked lists on pre-sorted input, AVL guarantees strict balance and logarithmic lookups.',
      advantages: 'Guaranteed logarithmic performance, optimal for heavy retrieval and continuous order maintenance.'
    },
    trie: {
      title: 'Trie (Prefix Tree)',
      icon: Search,
      desc: 'An ordered search tree used to store associative structures, where keys are usually strings representing prefixes.',
      timeComp: 'O(L) where L is name length, completely independent of total contacts count',
      spaceComp: 'O(M * L) where M is keys and L is average length',
      whyUsed: 'Powers instant, characters-as-you-type prefix searching and dynamic autocomplete suggestions in the search bar.',
      advantages: 'Unmatched speed for autocomplete, prefix lookups, and wildcard fuzzy matches.'
    },
    hash: {
      title: 'Hashed Duplicate Detector',
      icon: Hash,
      desc: 'Stores key-value pairs with modular rolling hash keys and dynamic linked list chaining to resolve collisions.',
      timeComp: 'O(1) average lookup, insertion, and deletion',
      spaceComp: 'O(N) to store hashed buckets',
      whyUsed: 'Ensures instantaneous duplicate checking for Emails and Phone Numbers on contact registration and edits.',
      advantages: 'Absolute O(1) constraints, resolving collisions via robust list chaining.'
    },
    graph: {
      title: 'Contact Relationships Graph',
      icon: Network,
      desc: 'A collection of vertices (contacts) connected by undirected edges (shared workspace groups). Supports complete DFS/BFS traversals.',
      timeComp: 'BFS & DFS: O(V + E) where V is contacts and E is group connections',
      spaceComp: 'O(V + E) for adjacency list matrix storage',
      whyUsed: 'Maps organizational structures and social connections. Supports BFS/DFS inquiries to trace paths of relations.',
      advantages: 'Models real-world networking graphs, allowing traversal to discover second-degree colleagues.'
    },
    stack: {
      title: 'Recent Activity LIFO Stack',
      icon: Layers,
      desc: 'A Last-In-First-Out sequential linear pile where the last viewed contact is pushed to the top.',
      timeComp: 'Push / Pop: O(1) constant time',
      spaceComp: 'O(K) where K is capped history size (e.g., 5-30 views)',
      whyUsed: 'Tracks "Recently Viewed Contacts" dynamically. As users tap contacts, they push to stack top for rapid tab retrieval.',
      advantages: 'Instantaneous retrieval of most recently accessed nodes.'
    },
    queue: {
      title: 'Undo Buffer FIFO Queue',
      icon: Layers2,
      desc: 'A First-In-First-Out line of deleted contact buffers to safely recover items.',
      timeComp: 'Enqueue / Dequeue: O(1) constant time',
      spaceComp: 'O(U) where U is maximum buffered deletes',
      whyUsed: 'Stores deleted contacts temporarily to enable a robust, single-click "Undo Delete" restoration process.',
      advantages: 'Preserves correct historical ordering for sequential restorations.'
    },
    priority_queue: {
      title: 'Interaction Max-Heap',
      icon: Award,
      desc: 'A binary tree heap structure that orders favorite contacts based on interaction frequency counts.',
      timeComp: 'Peak Top: O(1) | Push / Pop Heapify: O(log N)',
      spaceComp: 'O(F) where F is the count of favorited contacts',
      whyUsed: 'Ranks the "Favorites Dashboard Widget". The contact you call or view the most bubbles to the absolute top of the pile.',
      advantages: 'Optimizes high-priority element lookup in dynamic interaction streams.'
    }
  };

  const currentMetadata = dsaMetadata[activeDSA];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Selector & Metadata */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass shadow-xl rounded-2xl p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md">
          <h3 className="text-lg font-semibold mb-4 text-slate-100 flex items-center gap-2">
            <GitFork className="text-sky-400 w-5 h-5" />
            DSA Core Engine
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Select a custom manual C++ data structure below to visualize how the CRM active data is indexed and traversed inside the backend engine:
          </p>
          
          <div className="space-y-2">
            {(Object.keys(dsaMetadata) as DSAType[]).map(key => {
              const Icon = dsaMetadata[key].icon;
              const isActive = activeDSA === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveDSA(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs transition-all duration-200 ${
                    isActive 
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 font-medium' 
                      : 'hover:bg-white/5 text-slate-300 border border-transparent hover:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                    <span>{dsaMetadata[key].title.split(' ')[0]} {dsaMetadata[key].title.split(' ')[1] || ''}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Complexity Card */}
        <div className="glass shadow-xl rounded-2xl p-5 border border-white/10 dark:border-white/5 bg-slate-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10">
              <currentMetadata.icon className="text-sky-400 w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">{currentMetadata.title}</h4>
              <p className="text-[10px] text-slate-400">Complexity Specification</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentMetadata.desc}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Time Complexity</div>
              <div className="text-xs text-emerald-400 font-mono font-semibold">{currentMetadata.timeComp}</div>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-0.5">Space Complexity</div>
              <div className="text-xs text-sky-400 font-mono font-semibold">{currentMetadata.spaceComp}</div>
            </div>
          </div>

          <div className="text-xs space-y-2 pt-2 border-t border-white/5">
            <div>
              <span className="font-semibold text-slate-200">Why implemented:</span>{' '}
              <span className="text-slate-400">{currentMetadata.whyUsed}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-200">Algorithmic edge:</span>{' '}
              <span className="text-slate-400">{currentMetadata.advantages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="lg:col-span-2 flex flex-col h-full min-h-[500px] glass shadow-xl rounded-3xl border border-white/10 dark:border-white/5 bg-slate-950/20 backdrop-blur-md overflow-hidden">
        {/* Canvas Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-white/5 bg-slate-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-widest font-mono">Live DSA Indexing Engine (C++ Mirror)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Contacts Indexed: {contacts.length}</span>
        </div>

        {/* Canvas Viewports */}
        <div className="flex-1 p-6 relative flex flex-col justify-center items-center overflow-auto min-h-[420px]">
          {contacts.length === 0 ? (
            <div className="text-center p-8 space-y-3">
              <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">No contacts available to index</p>
              <p className="text-xs text-slate-500">Add a contact in the Directory tab to watch this space structure itself!</p>
            </div>
          ) : (
            <div className="w-full h-full min-h-[350px] flex items-center justify-center">
              {activeDSA === 'avl' && (
                <div className="w-full flex flex-col items-center">
                  <h4 className="text-xs text-slate-400 font-semibold mb-4 text-center font-mono uppercase">AVL Balanced BST Map Representation (Ordered alphabetically)</h4>
                  {(() => {
                    const avlRoot = buildAVLTree();
                    
                    // Coordinates generator for visual tree layout
                    const nodesList: any[] = [];
                    const connectionsList: any[] = [];
                    
                    const traverseLayout = (node: AVLNode | null, x: number, y: number, offset: number) => {
                      if (!node) return;
                      node.x = x;
                      node.y = y;
                      nodesList.push(node);

                      if (node.left) {
                        connectionsList.push({ x1: x, y1: y, x2: x - offset, y2: y + 70 });
                        traverseLayout(node.left, x - offset, y + 70, offset * 0.5);
                      }
                      if (node.right) {
                        connectionsList.push({ x1: x, y1: y, x2: x + offset, y2: y + 70 });
                        traverseLayout(node.right, x + offset, y + 70, offset * 0.5);
                      }
                    };

                    traverseLayout(avlRoot, 280, 40, 110);

                    return (
                      <svg viewBox="0 0 560 300" className="w-full max-h-[300px] text-slate-100">
                        {/* Lines */}
                        {connectionsList.map((c, i) => (
                          <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
                        ))}
                        {/* Nodes */}
                        {nodesList.map((n, i) => {
                          const bf = (n.left ? n.left.height : 0) - (n.right ? n.right.height : 0);
                          const isSelected = selectedNode?.name === n.contact.name;
                          return (
                            <g 
                              key={i} 
                              transform={`translate(${n.x}, ${n.y})`}
                              className="cursor-pointer group"
                              onClick={() => setSelectedNode(n.contact)}
                            >
                              <circle 
                                r="22" 
                                fill={isSelected ? '#6366f1' : '#1e293b'} 
                                stroke={isSelected ? '#818cf8' : '#818cf8'} 
                                strokeWidth="2" 
                                className="transition-all duration-200 group-hover:fill-sky-950/50"
                              />
                              <text dy="-3" textAnchor="middle" className="text-[9px] font-semibold fill-slate-100">
                                {n.contact.name.split(' ')[0]}
                              </text>
                              <text dy="8" textAnchor="middle" className="text-[7px] font-mono font-bold fill-sky-300">
                                BF:{bf}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              )}

              {activeDSA === 'trie' && (
                <div className="w-full flex flex-col items-center">
                  <h4 className="text-xs text-slate-400 font-semibold mb-4 text-center font-mono uppercase">Trie Char Paths Autocomplete (Query string: "{searchQuery}")</h4>
                  <div className="w-full flex justify-center mb-4">
                    <div className="relative w-48">
                      <input
                        type="text"
                        placeholder="Search char prefix..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 outline-none focus:border-sky-500"
                      />
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1.5 text-slate-400" />
                    </div>
                  </div>

                  {(() => {
                    const trie = buildTrie();
                    // Let's draw standard characters nodes for root and first level, plus query match highlight
                    const levels: any[][] = [[], [], []]; // Root, Level 1 chars, Level 2 chars
                    
                    levels[0].push({ char: '^', isWord: false, pathMatch: true, x: 280, y: 30 });
                    
                    const rootKeys = Object.keys(trie.children).sort().slice(0, 7);
                    rootKeys.forEach((key, idx) => {
                      const x = 50 + idx * 75;
                      const isMatch = searchQuery && key === searchQuery[0]?.toLowerCase();
                      levels[1].push({ 
                        char: key.toUpperCase(), 
                        isWord: trie.children[key].isWord, 
                        pathMatch: isMatch,
                        parentIdx: 0,
                        x, 
                        y: 110 
                      });

                      const subKeys = Object.keys(trie.children[key].children).sort().slice(0, 2);
                      subKeys.forEach((subKey, sidx) => {
                        const subX = x - 15 + sidx * 30;
                        const isSubMatch = isMatch && searchQuery.length > 1 && subKey === searchQuery[1]?.toLowerCase();
                        levels[2].push({
                          char: subKey.toUpperCase(),
                          isWord: trie.children[key].children[subKey].isWord,
                          pathMatch: isSubMatch,
                          parentX: x,
                          parentY: 110,
                          x: subX,
                          y: 190
                        });
                      });
                    });

                    return (
                      <svg viewBox="0 0 560 250" className="w-full max-h-[250px]">
                        {/* Parent connections */}
                        {levels[1].map((node, i) => (
                          <line key={`c1-${i}`} x1="280" y1="30" x2={node.x} y2={node.y} stroke={node.pathMatch ? '#10b981' : '#475569'} strokeWidth={node.pathMatch ? '2' : '1'} />
                        ))}
                        {levels[2].map((node, i) => (
                          <line key={`c2-${i}`} x1={node.parentX} y1={node.parentY} x2={node.x} y2={node.y} stroke={node.pathMatch ? '#10b981' : '#475569'} strokeWidth={node.pathMatch ? '2' : '1'} />
                        ))}

                        {/* Node Render */}
                        {levels.flat().map((n, i) => (
                          <g key={i} transform={`translate(${n.x}, ${n.y})`}>
                            <circle 
                              r="15" 
                              fill={n.pathMatch ? '#065f46' : '#1e293b'} 
                              stroke={n.pathMatch ? '#34d399' : '#475569'} 
                              strokeWidth="1.5" 
                            />
                            <text dy="4" textAnchor="middle" className="text-[10px] font-bold font-mono fill-slate-100">
                              {n.char}
                            </text>
                            {n.isWord && (
                              <circle cx="10" cy="-10" r="3" fill="#10b981" />
                            )}
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              )}

              {activeDSA === 'hash' && (
                <div className="w-full flex flex-col items-center">
                  <h4 className="text-xs text-slate-400 font-semibold mb-4 text-center font-mono uppercase">Polynomial Rolling Hash Index & List Chaining Chords</h4>
                  <div className="w-full grid grid-cols-8 gap-2 max-w-lg mt-2">
                    {Array.from({ length: 16 }).map((_, idx) => {
                      // Simulating bucket filling
                      const bucketContacts = contacts.filter(c => (c.id % 16) === idx);
                      const hasCollision = bucketContacts.length > 1;
                      
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-full py-3 rounded-xl border text-center font-mono text-[10px] font-semibold transition-all duration-300 ${
                            bucketContacts.length > 0
                              ? hasCollision
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border-white/5 text-slate-600'
                          }`}>
                            [{idx}]
                          </div>
                          {bucketContacts.map((bc, sidx) => (
                            <div key={sidx} className="w-1 bg-sky-400 h-2 flex flex-col items-center relative group">
                              <div className="w-2.5 h-2.5 bg-sky-500 rounded-full cursor-pointer hover:scale-125 transition-transform" />
                              <div className="absolute top-4 hidden group-hover:block bg-slate-900 border border-white/10 p-2 rounded-lg text-[9px] z-20 whitespace-nowrap shadow-lg">
                                <span className="font-semibold text-slate-100">{bc.name}</span>
                                <div className="text-[8px] text-slate-400">ID: {bc.id} | Hash: {(bc.id * 31) % 1024}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-6 max-w-sm text-center leading-relaxed font-mono">
                    Green indicates single hashes. Orange indicates hash key collisions resolved via custom LinkedList chaining.
                  </p>
                </div>
              )}

              {activeDSA === 'graph' && (
                <div className="w-full flex flex-col items-center">
                  <h4 className="text-xs text-slate-400 font-semibold mb-2 text-center font-mono uppercase">Social Networking Graph (Connected by Shared Groups)</h4>
                  
                  <div className="flex gap-2.5 mb-4">
                    <button 
                      onClick={() => contacts[0] && runBFS(contacts[0].id)} 
                      disabled={animatingNode !== null}
                      className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Animate BFS Traversal
                    </button>
                    <button 
                      onClick={() => contacts[0] && runDFS(contacts[0].id)} 
                      disabled={animatingNode !== null}
                      className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Animate DFS Traversal
                    </button>
                  </div>

                  {(() => {
                    const edges = buildGraphEdges();
                    const numNodes = contacts.length;
                    
                    // Simple radial node positions
                    const positions = contacts.map((c, i) => {
                      const angle = (i * 2 * Math.PI) / numNodes;
                      const r = 90;
                      return {
                        id: c.id,
                        name: c.name,
                        x: 280 + r * Math.cos(angle),
                        y: 130 + r * Math.sin(angle)
                      };
                    });

                    return (
                      <svg viewBox="0 0 560 260" className="w-full max-h-[260px]">
                        {/* Draw Edges */}
                        {edges.map((e, idx) => {
                          const p1 = positions.find(p => p.id === e.source);
                          const p2 = positions.find(p => p.id === e.target);
                          if (!p1 || !p2) return null;
                          return (
                            <line 
                              key={idx} 
                              x1={p1.x} 
                              y1={p1.y} 
                              x2={p2.x} 
                              y2={p2.y} 
                              stroke="#475569" 
                              strokeWidth="1.5" 
                              opacity="0.5" 
                            />
                          );
                        })}

                        {/* Draw Nodes */}
                        {positions.map((p, idx) => {
                          const isAnimating = animatingNode === p.id;
                          const inBfs = bfsResult.includes(p.id);
                          const inDfs = dfsResult.includes(p.id);
                          let strokeColor = '#818cf8';
                          let fillColor = '#1e293b';

                          if (isAnimating) {
                            strokeColor = '#f59e0b';
                            fillColor = '#78350f';
                          } else if (inBfs && bfsResult.indexOf(p.id) === bfsResult.length - 1) {
                            strokeColor = '#06b6d4';
                            fillColor = '#164e63';
                          } else if (inDfs && dfsResult.indexOf(p.id) === dfsResult.length - 1) {
                            strokeColor = '#10b981';
                            fillColor = '#064e3b';
                          }

                          return (
                            <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
                              <circle 
                                r="18" 
                                fill={fillColor} 
                                stroke={strokeColor} 
                                strokeWidth="2" 
                                className="transition-all duration-300"
                              />
                              <text dy="4" textAnchor="middle" className="text-[8px] font-bold fill-slate-200">
                                {p.name.substring(0, 3).toUpperCase()}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}

                  <div className="mt-2 text-[10px] font-mono text-slate-400 flex gap-4">
                    {bfsResult.length > 0 && (
                      <div><span className="text-sky-400 font-bold">BFS:</span> {bfsResult.map(id => contacts.find(c => c.id === id)?.name.split(' ')[0]).join(' → ')}</div>
                    )}
                    {dfsResult.length > 0 && (
                      <div><span className="text-emerald-400 font-bold">DFS:</span> {dfsResult.map(id => contacts.find(c => c.id === id)?.name.split(' ')[0]).join(' → ')}</div>
                    )}
                  </div>
                </div>
              )}

              {activeDSA === 'stack' && (
                <div className="w-full flex flex-col items-center max-w-sm">
                  <h4 className="text-xs text-slate-400 font-semibold mb-4 text-center font-mono uppercase">Recently Viewed LIFO Stack Pile</h4>
                  <div className="flex flex-col-reverse gap-2 w-full border-b border-white/20 pb-2">
                    {recentViews.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">No active stack reads. Tap contacts in the Directory tab!</div>
                    ) : (
                      recentViews.slice(0, 5).map((rv, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3 rounded-xl border font-mono text-xs transition-all duration-300 ${
                            idx === recentViews.length - 1 || idx === 4
                              ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 shadow-lg shadow-sky-500/10' 
                              : 'bg-white/5 border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="opacity-50">[{idx}]</span>
                            <span className="font-semibold text-slate-100">{rv.name}</span>
                          </div>
                          <span className="text-[10px] text-sky-400 font-bold">{idx === recentViews.length - 1 || idx === 4 ? 'TOP OF STACK' : 'STORED'}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 text-center font-mono leading-relaxed">
                    Tap any contact in Directory to trigger a LIFO push. When returning to dashboard, recent activities pop from stack top.
                  </p>
                </div>
              )}

              {activeDSA === 'queue' && (
                <div className="w-full flex flex-col items-center max-w-md">
                  <h4 className="text-xs text-slate-400 font-semibold mb-4 text-center font-mono uppercase">Deleted Contacts FIFO Undo Queue Line</h4>
                  <div className="flex items-center gap-2 w-full justify-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mr-2">Tail</div>
                    {undoQueueSize === 0 ? (
                      <div className="text-center border border-dashed border-white/10 p-5 rounded-2xl w-full text-slate-500 text-xs font-mono">
                        FIFO Undo Queue is currently empty. Deleted contacts line up here.
                      </div>
                    ) : (
                      Array.from({ length: undoQueueSize }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 w-28 rounded-xl border font-mono text-[10px] text-center transition-all duration-300 bg-amber-500/10 border-amber-500/40 text-amber-300`}
                        >
                          <Layers2 className="w-4 h-4 mx-auto mb-1 opacity-75" />
                          <div>Deleted #{idx + 1}</div>
                        </div>
                      ))
                    )}
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider ml-2">Head</div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-6 text-center font-mono leading-relaxed max-w-sm">
                    First Deleted Contact sits at the Head of the Queue, making it the first contact popped and restored on single-click Undo.
                  </p>
                </div>
              )}

              {activeDSA === 'priority_queue' && (
                <div className="w-full flex flex-col items-center">
                  <h4 className="text-xs text-slate-400 font-semibold mb-4 text-center font-mono uppercase">Favorites Max-Heap Binary Tree (Ranked by Interactions)</h4>
                  {favorites.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">No favorited contacts. Star contacts in Directory tab!</div>
                  ) : (
                    <svg viewBox="0 0 560 220" className="w-full max-h-[220px]">
                      {/* Tree connects */}
                      {favorites.map((_, i) => {
                        if (i === 0) return null;
                        const parentIdx = Math.floor((i - 1) / 2);
                        const px = parentIdx === 0 ? 280 : parentIdx === 1 ? 140 : 420;
                        const py = parentIdx === 0 ? 35 : 100;
                        const cx = i === 1 ? 140 : i === 2 ? 420 : i === 3 ? 80 : i === 4 ? 200 : i === 5 ? 360 : 480;
                        const cy = i >= 3 ? 165 : 100;
                        return (
                          <line key={i} x1={px} y1={py} x2={cx} y2={cy} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,3" />
                        );
                      })}

                      {/* Nodes */}
                      {favorites.map((f, i) => {
                        const cx = i === 0 ? 280 : i === 1 ? 140 : i === 2 ? 420 : i === 3 ? 80 : i === 4 ? 200 : i === 5 ? 360 : 480;
                        const cy = i === 0 ? 35 : i < 3 ? 100 : 165;
                        return (
                          <g key={i} transform={`translate(${cx}, ${cy})`}>
                            <circle 
                              r="18" 
                              fill={i === 0 ? '#78350f' : '#1e293b'} 
                              stroke="#fbbf24" 
                              strokeWidth="2" 
                            />
                            <text dy="-2" textAnchor="middle" className="text-[8px] font-bold fill-slate-200">
                              {f.name.split(' ')[0]}
                            </text>
                            <text dy="8" textAnchor="middle" className="text-[7px] font-mono fill-amber-400 font-bold">
                              🔥{f.interactionCount}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                  <p className="text-[10px] text-slate-500 mt-4 text-center font-mono leading-relaxed max-w-sm">
                    In this Max-Heap representation, the favorited contact with the highest interaction frequency bubbles to the root node (top).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Contact Node Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 dark:border-white/5 bg-slate-900/50 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 font-bold text-sky-400 text-sm">
                  {selectedNode.name.charAt(0)}
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-slate-100">{selectedNode.name}</h5>
                  <p className="text-[10px] text-slate-400">{selectedNode.company || 'No Company'} • {selectedNode.emails[0]}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {selectedNode.tags.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] text-slate-300 font-mono border border-white/5">
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
