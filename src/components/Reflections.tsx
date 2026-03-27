import { useState, FormEvent, useMemo } from 'react';
import { Reflection, Lesson } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Book, MessageSquare, Lightbulb, Target, Smile, Frown, Meh, Zap, Brain, Search, Filter, X, Calendar, Pencil, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, isSameMonth, parseISO } from 'date-fns';

interface ReflectionsProps {
  reflections: Reflection[];
  lessons: Lesson[];
  dailyIntention: string;
  onAddReflection: (reflection: Omit<Reflection, 'id'>) => void;
  onDeleteReflection: (id: number) => void;
  onUpdateReflection: (id: number, reflection: Partial<Reflection>) => void;
  onAddLesson: (text: string) => void;
  onDeleteLesson: (id: number) => void;
  onToggleLesson: (id: number) => void;
  onUpdateDailyIntention: (text: string) => void;
}

const MOODS = [
  { icon: Smile, label: 'Focused', color: 'text-[var(--up)]', bg: 'bg-[var(--up)]/10' },
  { icon: Zap, label: 'Overconfident', color: 'text-[var(--sky2)]', bg: 'bg-[var(--sky)]/10' },
  { icon: Meh, label: 'Disciplined', color: 'text-[var(--t1)]', bg: 'bg-white/5' },
  { icon: Frown, label: 'Frustrated', color: 'text-[var(--dn2)]', bg: 'bg-[var(--dn)]/10' },
  { icon: Brain, label: 'Anxious', color: 'text-orange-400', bg: 'bg-orange-400/10' },
];

export function Reflections({
  reflections,
  lessons,
  dailyIntention,
  onAddReflection,
  onDeleteReflection,
  onUpdateReflection,
  onAddLesson,
  onDeleteLesson,
  onToggleLesson,
  onUpdateDailyIntention
}: ReflectionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reflection>>({});
  
  const [newReflection, setNewReflection] = useState({
    title: '',
    content: '',
    mood: 'Disciplined',
    book: ''
  });
  const [newLesson, setNewLesson] = useState('');

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // YYYY-MM

  const handleAddReflection = () => {
    if (!newReflection.title || !newReflection.content) return;
    onAddReflection({
      ...newReflection,
      date: new Date().toISOString()
    });
    setNewReflection({ title: '', content: '', mood: 'Disciplined', book: '' });
    setIsAdding(false);
  };

  const startEditing = (ref: Reflection) => {
    setEditingId(ref.id);
    setEditForm(ref);
  };

  const saveEdit = () => {
    if (editingId && editForm.title && editForm.content) {
      onUpdateReflection(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleAddLesson = (e: FormEvent) => {
    e.preventDefault();
    if (!newLesson.trim()) return;
    onAddLesson(newLesson.trim());
    setNewLesson('');
  };

  // Filtered Reflections
  const filteredReflections = useMemo(() => {
    return reflections.filter(ref => {
      const matchesSearch = 
        ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ref.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ref.book && ref.book.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesMood = !selectedMood || ref.mood === selectedMood;
      
      const matchesMonth = !selectedMonth || isSameMonth(parseISO(ref.date), parseISO(selectedMonth + "-01"));

      return matchesSearch && matchesMood && matchesMonth;
    });
  }, [reflections, searchQuery, selectedMood, selectedMonth]);

  // Get unique months for filtering
  const availableMonths = useMemo(() => {
    const months = reflections.map(ref => format(parseISO(ref.date), 'yyyy-MM'));
    return Array.from(new Set(months)).sort().reverse();
  }, [reflections]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
      {/* Left Column: Lessons & Intentions */}
      <div className="lg:col-span-4 space-y-6">
        {/* Daily Intention */}
        <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-[var(--sky2)]" size={18} />
            <h3 className="text-[0.85rem] font-bold text-[var(--t0)] uppercase tracking-wider">Daily Intention</h3>
          </div>
          <textarea
            value={dailyIntention}
            onChange={(e) => onUpdateDailyIntention(e.target.value)}
            placeholder="What is your main focus for today's session?"
            className="w-full h-24 bg-[var(--ink)] border border-[var(--wire)] rounded-lg p-3 text-[0.85rem] text-[var(--t1)] outline-none focus:border-[var(--sky)] transition-all resize-none"
          />
          <div className="mt-2 text-[0.65rem] text-[var(--t3)] italic">
            "I will not revenge trade today. I will follow my plan."
          </div>
        </div>

        {/* Golden Rules / Lessons Learned */}
        <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="text-yellow-400" size={18} />
              <h3 className="text-[0.85rem] font-bold text-[var(--t0)] uppercase tracking-wider">Golden Rules</h3>
            </div>
            <span className="text-[0.65rem] font-mono text-[var(--t3)]">{lessons.length} rules</span>
          </div>
          
          <form onSubmit={handleAddLesson} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newLesson}
              onChange={(e) => setNewLesson(e.target.value)}
              placeholder="Add a new rule..."
              className="flex-1 bg-[var(--ink)] border border-[var(--wire)] rounded-lg px-3 py-2 text-[0.8rem] text-[var(--t0)] outline-none focus:border-[var(--sky)]"
            />
            <button type="submit" className="p-2 bg-[var(--sky)]/10 text-[var(--sky2)] rounded-lg hover:bg-[var(--sky)]/20 transition-all">
              <Plus size={18} />
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all group",
                  lesson.isCompleted ? "bg-white/2 border-transparent opacity-50" : "bg-white/4 border-white/5 hover:border-white/10"
                )}
              >
                <button 
                  onClick={() => onToggleLesson(lesson.id)}
                  className="mt-0.5 text-[var(--t3)] hover:text-[var(--sky2)] transition-colors"
                >
                  {lesson.isCompleted ? <CheckCircle2 size={16} className="text-[var(--up)]" /> : <Circle size={16} />}
                </button>
                <span className={cn("text-[0.82rem] flex-1 leading-relaxed", lesson.isCompleted && "line-through")}>
                  {lesson.text}
                </span>
                <button 
                  onClick={() => onDeleteLesson(lesson.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--t3)] hover:text-[var(--dn2)] transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Reflection Journal */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-[var(--sky2)]" size={24} />
            <h2 className="text-xl font-bold text-[var(--t0)]">Journey Reflections</h2>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-br from-[var(--sky)] to-[#0284c7] rounded-lg text-white font-bold text-[0.85rem] shadow-lg hover:-translate-y-px transition-all w-fit"
          >
            <Plus size={18} /> New Entry
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-4 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections, books, or lessons..."
                className="w-full bg-[var(--ink)] border border-[var(--wire)] rounded-lg pl-10 pr-4 py-2 text-[0.85rem] text-[var(--t0)] outline-none focus:border-[var(--sky)]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--t3)] hover:text-[var(--t0)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" size={14} />
                <select
                  value={selectedMood || ''}
                  onChange={(e) => setSelectedMood(e.target.value || null)}
                  className="bg-[var(--ink)] border border-[var(--wire)] rounded-lg pl-9 pr-8 py-2 text-[0.8rem] text-[var(--t0)] outline-none focus:border-[var(--sky)] appearance-none cursor-pointer"
                >
                  <option value="">All Moods</option>
                  {MOODS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" size={14} />
                <select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value || null)}
                  className="bg-[var(--ink)] border border-[var(--wire)] rounded-lg pl-9 pr-8 py-2 text-[0.8rem] text-[var(--t0)] outline-none focus:border-[var(--sky)] appearance-none cursor-pointer"
                >
                  <option value="">All Time</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{format(parseISO(m + "-01"), 'MMMM yyyy')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {isAdding && (
          <div className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-6 shadow-2xl animate-fadeUp">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Entry Title</label>
                <input
                  type="text"
                  value={newReflection.title}
                  onChange={(e) => setNewReflection({ ...newReflection, title: e.target.value })}
                  placeholder="e.g. Weekly Review, Major Breakthrough..."
                  className="w-full bg-[var(--ink)] border border-[var(--wire)] rounded-lg px-4 py-2.5 text-[0.9rem] text-[var(--t0)] outline-none focus:border-[var(--sky)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Book / Resource (Optional)</label>
                <div className="relative">
                  <Book className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--t3)]" size={14} />
                  <input
                    type="text"
                    value={newReflection.book}
                    onChange={(e) => setNewReflection({ ...newReflection, book: e.target.value })}
                    placeholder="e.g. Trading in the Zone"
                    className="w-full bg-[var(--ink)] border border-[var(--wire)] rounded-lg pl-9 pr-4 py-2.5 text-[0.9rem] text-[var(--t0)] outline-none focus:border-[var(--sky)]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 mb-4">
              <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Current Mood</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const Icon = m.icon;
                  const isActive = newReflection.mood === m.label;
                  return (
                    <button
                      key={m.label}
                      onClick={() => setNewReflection({ ...newReflection, mood: m.label })}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        isActive ? cn("border-[var(--sky)] bg-[var(--sky)]/10", m.color) : "border-white/5 bg-white/3 text-[var(--t2)] hover:bg-white/6"
                      )}
                    >
                      <Icon size={16} />
                      <span className="text-[0.75rem] font-semibold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 mb-6">
              <label className="text-[0.65rem] font-bold text-[var(--t2)] uppercase tracking-wider">Your Thoughts</label>
              <textarea
                value={newReflection.content}
                onChange={(e) => setNewReflection({ ...newReflection, content: e.target.value })}
                placeholder="Write about your trades, emotions, or what you learned from your reading..."
                className="w-full h-40 bg-[var(--ink)] border border-[var(--wire)] rounded-lg p-4 text-[0.9rem] text-[var(--t1)] outline-none focus:border-[var(--sky)] transition-all resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 text-[var(--t2)] font-semibold hover:text-[var(--t0)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddReflection}
                className="px-6 py-2.5 bg-[var(--sky)] text-white font-bold rounded-lg shadow-lg hover:bg-[var(--sky2)] transition-all"
              >
                Save Entry
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredReflections.map((ref) => {
            const isEditing = editingId === ref.id;
            const mood = MOODS.find(m => m.label === (isEditing ? editForm.mood : ref.mood)) || MOODS[2];
            const MoodIcon = mood.icon;
            
            return (
              <div key={ref.id} className="bg-[var(--ink2)] border border-[var(--wire2)] rounded-[var(--r3)] p-6 shadow-lg group hover:border-white/10 transition-all">
                {isEditing ? (
                  <div className="space-y-4 animate-fadeUp">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full bg-[var(--ink)] border border-[var(--wire)] rounded-lg px-3 py-2 text-[0.9rem] text-[var(--t0)] outline-none focus:border-[var(--sky)]"
                      />
                      <input
                        type="text"
                        value={editForm.book}
                        onChange={(e) => setEditForm({ ...editForm, book: e.target.value })}
                        placeholder="Book / Resource"
                        className="w-full bg-[var(--ink)] border border-[var(--wire)] rounded-lg px-3 py-2 text-[0.9rem] text-[var(--t0)] outline-none focus:border-[var(--sky)]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map((m) => {
                        const Icon = m.icon;
                        const isActive = editForm.mood === m.label;
                        return (
                          <button
                            key={m.label}
                            onClick={() => setEditForm({ ...editForm, mood: m.label })}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all",
                              isActive ? cn("border-[var(--sky)] bg-[var(--sky)]/10", m.color) : "border-white/5 bg-white/3 text-[var(--t2)] hover:bg-white/6"
                            )}
                          >
                            <Icon size={14} />
                            <span className="text-[0.7rem] font-semibold">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full h-32 bg-[var(--ink)] border border-[var(--wire)] rounded-lg p-3 text-[0.9rem] text-[var(--t1)] outline-none focus:border-[var(--sky)] transition-all resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-[var(--t2)] text-[0.8rem] font-semibold"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={saveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--sky)] text-white text-[0.8rem] font-bold rounded-lg"
                      >
                        <Save size={14} /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-[var(--t0)]">{ref.title}</h3>
                          <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider", mood.bg, mood.color)}>
                            <MoodIcon size={12} />
                            {ref.mood}
                          </div>
                        </div>
                        <div className="text-[0.7rem] text-[var(--t3)] font-mono">
                          {format(parseISO(ref.date), 'MMMM d, yyyy • h:mm a')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => startEditing(ref)}
                          className="p-2 text-[var(--t3)] hover:text-[var(--sky2)] hover:bg-[var(--sky)]/10 rounded-lg transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteReflection(ref.id)}
                          className="p-2 text-[var(--t3)] hover:text-[var(--dn2)] hover:bg-[var(--dn)]/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {ref.book && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-white/3 rounded-lg w-fit">
                        <Book className="text-[var(--sky2)]" size={12} />
                        <span className="text-[0.72rem] text-[var(--t2)] font-medium italic">Reflecting on: {ref.book}</span>
                      </div>
                    )}

                    <div className="text-[0.9rem] text-[var(--t1)] leading-relaxed whitespace-pre-wrap">
                      {ref.content}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {filteredReflections.length === 0 && (
            <div className="text-center py-20 bg-[var(--ink2)] border border-dashed border-[var(--wire)] rounded-[var(--r3)]">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-[var(--t3)]" size={32} />
              </div>
              <h3 className="text-[var(--t0)] font-bold mb-1">No reflections found</h3>
              <p className="text-[var(--t2)] text-[0.8rem] max-w-xs mx-auto">
                {searchQuery || selectedMood || selectedMonth 
                  ? "Try adjusting your filters or search query." 
                  : "Write your first reflection to track your growth."}
              </p>
              {(searchQuery || selectedMood || selectedMonth) && (
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedMood(null); setSelectedMonth(null); }}
                  className="mt-4 text-[var(--sky2)] font-bold text-[0.85rem] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
