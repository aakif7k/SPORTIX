import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Trash2, X, Plus, Edit, Eye,
  Lock, Settings, BarChart3, Shield, Activity, AlertTriangle, Send, ShieldCheck,
  Timer, Trophy, Search, UserPlus, Upload, Image as ImageIcon, Clipboard,
  Clock, Sparkles, Calendar, Flame, Coffee, Award
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { MissingFieldsModal } from '../../components/ui/MissingFieldsModal';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { databases, DATABASE_ID, COLLECTIONS } from '../../lib/appwrite';
import { uploadEventBannerImage } from '../../services/storageService';
import { SPORT_CATEGORIES } from '../../services/mockData';
import {
  getEventParticipants,
  removeParticipantByOrganizer,
  addParticipantByOrganizer,
  searchProfilesForOrganizer,
  type DbEventParticipant,
} from '../../services/eventService';
import {
  getEventAnnouncements,
  createEventAnnouncement,
  deleteEventAnnouncement,
  getEventSchedule,
  createScheduleItem,
  deleteScheduleItem,
  type EventAnnouncement,
  type EventScheduleItem,
} from '../../services/announcementService';
import { getEventLifecycleState } from '../../services/eventLifecycleService';
import type { EventFormat, SportCategory, ExperienceLevel } from '../../types';

const TABS = [
  { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  { id: 'schedule', label: 'Schedule', icon: Timer },
  { id: 'participants', label: 'Athletes', icon: Users },
  { id: 'bracket', label: 'Bracket', icon: Trophy },
  { id: 'announcements', label: 'Announcements', icon: Send },
  { id: 'details', label: 'Edit Info', icon: Edit },
  { id: 'settings', label: 'Rules & Privacy', icon: Settings },
];

export const ManageEvent: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, loadEvent, updateEvent } = useEventStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dbParticipants, setDbParticipants] = useState<DbEventParticipant[]>([]);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);
  const [scheduleItems, setScheduleItems] = useState<EventScheduleItem[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annCategory, setAnnCategory] = useState<'GENERAL' | 'SCHEDULE' | 'IMPORTANT' | 'MATCH' | 'VENUE' | 'REGISTRATION'>('GENERAL');
  const [isPublishing, setIsPublishing] = useState(false);

  // Schedule Item Form State
  const [schTitle, setSchTitle] = useState('');
  const [schTime, setSchTime] = useState('10:00 AM');
  const [schDesc, setSchDesc] = useState('');
  const [schHour, setSchHour] = useState('10');
  const [schMin, setSchMin] = useState('00');
  const [schPeriod, setSchPeriod] = useState<'AM' | 'PM'>('AM');
  const [schTimeMode, setSchTimeMode] = useState<'preset' | 'custom'>('preset');
  const [showSchModal, setShowSchModal] = useState(false);

  // Add Athlete Modal State
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Remove Athlete Confirmation Modal
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  // Event Details Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [format, setFormat] = useState<EventFormat>('tournament');
  const [sport, setSport] = useState<SportCategory>('football');
  const [skillLevel, setSkillLevel] = useState<ExperienceLevel>('amateur');
  const [maxParticipants, setMaxParticipants] = useState('32');
  const [prizePool, setPrizePool] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [rules, setRules] = useState<string[]>(['']);
  const [bannerImage, setBannerImage] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Access control states
  const [isPublic, setIsPublic] = useState(true);
  const [isInviteOnly, setIsInviteOnly] = useState(false);

  const currentUserId = user?.id || (user as any)?.$id || (user as any)?.uid || '';

  const refreshAllData = async (eventId: string) => {
    setLoading(true);
    await loadEvent(eventId);

    const [pts, anns, schs] = await Promise.all([
      getEventParticipants(eventId),
      getEventAnnouncements(eventId),
      getEventSchedule(eventId),
    ]);

    setDbParticipants(pts);
    setAnnouncements(anns);
    setScheduleItems(schs);

    // Fetch matches for event if any
    try {
      const matchRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        [databases as any ? (window as any) : undefined].filter(Boolean)
      );
      setMatches(matchRes.documents.filter((m: any) => m.event_id === eventId));
    } catch {
      setMatches([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      refreshAllData(id);
    }
  }, [id]);

  const rawEvent = events.find(e => e.id === id);

  // Initialize edit forms when rawEvent changes
  useEffect(() => {
    if (rawEvent) {
      setTitle(rawEvent.title || '');
      setDescription(rawEvent.description || '');
      setVenue(rawEvent.venue || '');
      setLocation(rawEvent.location || '');
      setDate(rawEvent.date || '');
      setFormat(rawEvent.format || 'tournament');
      setSport(rawEvent.sport || 'football');
      setSkillLevel(rawEvent.skillLevel || 'amateur');
      setMaxParticipants(rawEvent.maxParticipants?.toString() || '32');
      setPrizePool(rawEvent.prizePool || '');
      setEntryFee(rawEvent.entryFee || '');
      setRules(rawEvent.rules?.length ? rawEvent.rules : ['']);
      setBannerImage(rawEvent.bannerImage || rawEvent.banner_image_url || (rawEvent as any).banner_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80');
    }
  }, [rawEvent]);

  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setBannerImage(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePasteBannerUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setBannerImage(text.trim());
        setBannerFile(null);
        toast.success('Pasted banner link from clipboard!');
      } else {
        toast.error('Clipboard is empty or does not contain a link.');
      }
    } catch {
      toast.error('Could not access clipboard. Please use Ctrl+V or Cmd+V directly in the input field.');
    }
  };

  if (loading && !rawEvent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted font-mono text-xs uppercase">Loading event management...</p>
        </div>
      </div>
    );
  }

  if (!rawEvent) {
    return (
      <div className="text-center py-16 font-mono text-[12px] text-text-muted">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-500 animate-pulse" />
        Event not found.
        <div className="mt-4">
          <Button onClick={() => navigate('/app/events')}>Go to Events</Button>
        </div>
      </div>
    );
  }

  const isOrganizer = rawEvent.organizerId === currentUserId;

  // OWNERSHIP GUARD
  if (!isOrganizer && currentUserId) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-surface border border-red-500/40 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <Lock size={24} />
        </div>
        <h2 className="font-display text-2xl uppercase font-bold text-text-primary">Access Denied</h2>
        <p className="font-mono text-xs text-text-secondary">
          Only the event organizer ({rawEvent.organizerId}) has permission to access host controls.
        </p>
        <Button onClick={() => navigate(`/app/events/${rawEvent.id}`)} variant="primary">
          Return to Event Overview
        </Button>
      </div>
    );
  }

  const filledSlots = dbParticipants.length;
  const maxSlots = rawEvent.maxParticipants || 10;
  const pctFull = Math.min(100, Math.round((filledSlots / maxSlots) * 100));
  const lifecycle = getEventLifecycleState(rawEvent);

  // Derive real registration velocity from dbParticipants createdAt timestamps
  const dateMap: Record<string, number> = {};
  dbParticipants.forEach(p => {
    const dayKey = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Joined';
    dateMap[dayKey] = (dateMap[dayKey] || 0) + 1;
  });
  const velocityData = Object.entries(dateMap).map(([name, signups]) => ({ name, signups }));

  // Derive real team status breakdown from dbParticipants (crews / teams)
  const teamMap: Record<string, number> = {};
  dbParticipants.forEach(p => {
    const tid = p.team_id || p.crew_id || 'Solo Players';
    teamMap[tid] = (teamMap[tid] || 0) + 1;
  });
  const teamsList = Object.entries(teamMap);

  // Handlers
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      toast.error('Please enter announcement title and message.');
      return;
    }
    setIsPublishing(true);
    const res = await createEventAnnouncement({
      eventId: rawEvent.id,
      eventTitle: rawEvent.title,
      organizerId: currentUserId,
      organizerName: user?.name || 'Event Host',
      organizerUsername: user?.username || 'host',
      title: annTitle,
      message: annMessage,
      category: annCategory,
    });
    setIsPublishing(false);

    if (res.success) {
      toast.success('Announcement published & participants notified!');
      setAnnTitle('');
      setAnnMessage('');
      if (id) refreshAllData(id);
    } else {
      toast.error(res.error || 'Failed to publish announcement.');
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (window.confirm('Delete this announcement?')) {
      const ok = await deleteEventAnnouncement(annId);
      if (ok) {
        toast.success('Announcement deleted.');
        if (id) refreshAllData(id);
      } else {
        toast.error('Failed to delete announcement.');
      }
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTime = schTime.trim() || `${schHour}:${schMin} ${schPeriod}`;

    const missing: string[] = [];
    if (!schTitle.trim()) missing.push('Activity Title');
    if (!finalTime.trim()) missing.push('Schedule Time');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowMissingModal(true);
      return;
    }

    const res = await createScheduleItem({
      eventId: rawEvent.id,
      organizerId: currentUserId,
      title: schTitle,
      time: finalTime,
      description: schDesc,
    });
    if (res.success) {
      toast.success('Schedule item added to timeline!');
      setSchTitle('');
      setSchTime('10:00 AM');
      setSchDesc('');
      setShowSchModal(false);
      if (id) refreshAllData(id);
    } else {
      toast.error(res.error || 'Failed to add schedule item.');
    }
  };

  const handleDeleteSchedule = async (schId: string) => {
    const ok = await deleteScheduleItem(schId);
    if (ok) {
      toast.success('Schedule item deleted.');
      if (id) refreshAllData(id);
    }
  };

  const handleConfirmRemoveAthlete = async () => {
    if (!removeTarget || !id) return;
    const res = await removeParticipantByOrganizer(id, removeTarget.id);
    if (res.success) {
      toast.success(res.message);
      setRemoveTarget(null);
      refreshAllData(id);
    } else {
      toast.error(res.message);
    }
  };

  const handleSearchAthletes = async (q: string) => {
    setAthleteSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchProfilesForOrganizer(q);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddAthleteToEvent = async (athleteId: string) => {
    if (!id) return;
    const res = await addParticipantByOrganizer(id, athleteId, 'solo');
    if (res.success) {
      toast.success(res.message);
      setShowAddAthleteModal(false);
      setAthleteSearchQuery('');
      setSearchResults([]);
      refreshAllData(id);
    } else {
      toast.error(res.message);
    }
  };

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const handleSaveDetails = async () => {
    if (!id) return;

    // Check mandatory required fields
    const missing: string[] = [];
    if (!title.trim()) missing.push('Event Name');
    if (!venue.trim()) missing.push('Venue Name');
    if (!location.trim()) missing.push('City / Location');

    if (missing.length > 0) {
      setMissingFields(missing);
      setShowMissingModal(true);
      return;
    }

    setIsSavingDetails(true);
    try {
      let uploadedFileId: string | undefined = (rawEvent as any)?.banner_file_id || (rawEvent as any)?.banner_image_file_id;
      let uploadedFileUrl: string | undefined = bannerImage;

      if (bannerFile) {
        setIsUploadingBanner(true);
        const uploadRes = await uploadEventBannerImage(bannerFile);
        setIsUploadingBanner(false);
        if (uploadRes) {
          uploadedFileId = uploadRes.fileId;
          uploadedFileUrl = uploadRes.fileUrl;
        }
      }

      // Map skillLevel to valid Appwrite enum (beginner | amateur | semi_pro | pro | elite)
      const VALID_SKILL_ENUMS = ['beginner', 'amateur', 'semi_pro', 'pro', 'elite'];
      let appwriteSkillLevel = skillLevel ? skillLevel.toString().replace(/-/g, '_').toLowerCase() : 'amateur';
      if (!VALID_SKILL_ENUMS.includes(appwriteSkillLevel)) {
        appwriteSkillLevel = 'amateur';
      }

      // Build payload containing ONLY valid Appwrite collection attributes
      const appwritePayload: Record<string, any> = {
        title,
        description,
        venue,
        location,
        starts_at: date ? new Date(date).toISOString() : new Date().toISOString(),
        format,
        sport,
        skill_level: appwriteSkillLevel,
        max_participants: parseInt(maxParticipants, 10) || 10,
        prize_pool: prizePool,
        entry_fee: entryFee,
        rules: rules.filter(Boolean),
      };

      if (uploadedFileId) appwritePayload.banner_file_id = uploadedFileId;
      if (uploadedFileUrl) appwritePayload.banner_url = uploadedFileUrl;

      await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, id, appwritePayload);

      updateEvent(id, {
        title,
        description,
        venue,
        location,
        date,
        format,
        sport,
        skillLevel,
        maxParticipants: parseInt(maxParticipants, 10) || 10,
        prizePool,
        entryFee,
        rules: rules.filter(Boolean),
        bannerImage: uploadedFileUrl,
        banner_image_file_id: uploadedFileId,
        banner_image_url: uploadedFileUrl,
      });

      toast.success('Event configuration saved successfully.');
      refreshAllData(id);
    } catch (err: any) {
      console.error('Error saving event details:', err);
      toast.error(err?.message || 'Failed to update event details.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleToggleCancelEvent = async () => {
    if (!id || !rawEvent) return;
    setIsCancelling(true);
    const newStatus = rawEvent.status === 'cancelled' ? 'upcoming' : 'cancelled';

    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, id, {
        status: newStatus,
      });

      updateEvent(id, { status: newStatus as any });

      if (newStatus === 'cancelled') {
        // Automatically publish cancellation broadcast announcement
        await createEventAnnouncement({
          eventId: id,
          eventTitle: rawEvent.title,
          organizerId: currentUserId,
          organizerName: user?.name || 'Event Host',
          title: '🚨 EVENT CANCELLED',
          message: `Notice to all athletes: ${rawEvent.title} has been officially cancelled by the host.`,
          category: 'IMPORTANT',
        });
        toast.success('Event status updated to CANCELLED. All participants notified.');
      } else {
        toast.success('Event status restored to UPCOMING.');
      }

      setShowCancelModal(false);
      refreshAllData(id);
    } catch (err: any) {
      console.error('Error toggling event status:', err);
      toast.error(err?.message || 'Failed to update event status.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-28 md:pb-12 pt-4 sm:pt-6 text-text-primary">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(`/app/events/${rawEvent.id}`)}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all bg-elevated border border-border-muted hover:border-accent"
        >
          <ArrowLeft size={18} className="text-text-secondary" />
        </motion.button>

        <div className="flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl relative overflow-hidden bg-surface border border-border-muted">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent/15 border border-accent/30 text-accent">
              <Settings size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[20px] sm:text-[24px] text-text-primary leading-none tracking-wider uppercase">MANAGE CLASH</h1>
                {lifecycle.isEnded && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-700 font-mono text-[9px] font-bold text-slate-300 uppercase">
                    COMPLETED (READ-ONLY)
                  </span>
                )}
              </div>
              <p className="font-mono text-[9px] sm:text-[10px] text-text-secondary mt-0.5 tracking-wider truncate max-w-[200px] sm:max-w-none">
                {rawEvent.title.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigate(`/app/events/${rawEvent.id}`)}>
              <Eye size={14} className="mr-1.5" /> View Public Page
            </Button>
            {rawEvent.status === 'cancelled' ? (
              <Button size="sm" variant="primary" onClick={() => setShowCancelModal(true)}>
                Restore Event
              </Button>
            ) : (
              <Button size="sm" variant="danger" onClick={() => setShowCancelModal(true)}>
                <AlertTriangle size={14} className="mr-1.5" /> Cancel Event
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4 md:gap-6">
        
        {/* ── NAVIGATION TABS ── */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left relative ${
                  isActive
                    ? 'bg-accent/15 border border-accent text-accent shadow-md'
                    : 'bg-elevated border border-border-muted text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={15} />
                <span className="font-sans text-[13px] font-bold uppercase">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className="min-h-[450px]">
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                
                {/* Analytics Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="glass rounded-[20px] p-4 border border-border-muted flex flex-col justify-between">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="font-mono text-[9px] uppercase tracking-widest">REGISTERED ATHLETES</span>
                      <Users size={16} className="text-accent" />
                    </div>
                    <div className="font-display text-xl sm:text-2xl mt-2 text-accent">{filledSlots}/{maxSlots}</div>
                  </div>

                  <div className="glass rounded-[20px] p-4 border border-border-muted flex flex-col justify-between">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="font-mono text-[9px] uppercase tracking-widest">CAPACITY %</span>
                      <Activity size={16} className="text-cyan-400" />
                    </div>
                    <div className="font-display text-xl sm:text-2xl mt-2 text-cyan-400">{pctFull}%</div>
                  </div>

                  <div className="glass rounded-[20px] p-4 border border-border-muted flex flex-col justify-between">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="font-mono text-[9px] uppercase tracking-widest">LIFECYCLE STATUS</span>
                      <Shield size={16} className="text-orange-500" />
                    </div>
                    <div className="font-display text-xl sm:text-2xl mt-2 text-orange-500 uppercase">{lifecycle.state}</div>
                  </div>
                </div>

                {/* Velocity and Teams breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Registration Velocity */}
                  <div className="glass rounded-[22px] p-5 border border-border-muted">
                    <h3 className="font-display text-base text-text-primary tracking-wider uppercase mb-4 flex items-center gap-2">
                      <Activity size={14} className="text-accent" /> Registration Velocity
                    </h3>
                    {velocityData.length < 2 ? (
                      <div className="h-40 flex items-center justify-center font-mono text-xs text-text-muted border border-dashed border-border-muted rounded-xl">
                        Not enough registration history yet.
                      </div>
                    ) : (
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height={160}>
                          <AreaChart data={velocityData}>
                            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10 }} />
                            <Area type="monotone" dataKey="signups" stroke="var(--accent)" strokeWidth={2} fill="rgba(204,255,0,0.15)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Team Status Breakdown */}
                  <div className="glass rounded-[22px] p-5 border border-border-muted flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-base text-text-primary tracking-wider uppercase mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-accent" /> Team Status Overview
                      </h3>
                      {teamsList.length === 0 ? (
                        <p className="font-mono text-xs text-text-muted">No teams formed yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {teamsList.map(([teamName, count]) => (
                            <div key={teamName} className="flex justify-between items-center text-xs font-mono">
                              <span className="text-text-secondary">{teamName}</span>
                              <span className="text-accent font-bold">{count} Registered</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-elevated/40 border border-border-muted font-mono text-[9px] text-text-muted">
                      💡 All changes to event participants update Appwrite database instantly.
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ── SCHEDULE TAB ── */}
            {activeTab === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg tracking-wider uppercase text-accent">Manage Event Schedule</h3>
                    <Button size="sm" onClick={() => setShowSchModal(true)}>
                      <Plus size={14} className="mr-1" /> Add Schedule Item
                    </Button>
                  </div>

                  {scheduleItems.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-border-muted rounded-2xl font-mono text-xs text-text-muted">
                      No schedule items added yet. Click &quot;Add Schedule Item&quot; to publish event timeline.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scheduleItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-elevated border border-border-muted">
                          <div className="flex items-center gap-4">
                            <span className="font-display text-base font-bold text-white w-20">{item.time}</span>
                            <div>
                              <div className="font-bold text-sm text-text-primary">{item.title}</div>
                              {item.description && <div className="font-mono text-xs text-text-muted mt-0.5">{item.description}</div>}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteSchedule(item.id)} className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── SUPERB MODERN ADD SCHEDULE ITEM MODAL ── */}
                {showSchModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 12 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 12 }}
                      className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-surface border border-accent/30 shadow-2xl overflow-hidden relative"
                    >
                      {/* Top Header Glow */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-volt to-emerald-400 z-10" />
                      
                      {/* Fixed Header */}
                      <div className="flex items-center justify-between p-5 border-b border-border-muted flex-shrink-0 bg-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
                            <Clock size={20} />
                          </div>
                          <div>
                            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
                              ADD SCHEDULE ITEM
                            </h3>
                            <p className="font-mono text-[10px] text-text-muted">Configure clash timeline & match milestones</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSchModal(false)}
                          className="w-8 h-8 rounded-xl bg-elevated border border-border-muted hover:border-accent text-text-muted hover:text-text-primary flex items-center justify-center transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Scrollable Form Body */}
                      <form onSubmit={handleAddSchedule} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                        
                        {/* MODE SELECTOR */}
                        <div className="flex items-center p-1 rounded-2xl bg-elevated border border-border-muted font-mono text-xs">
                          <button
                            type="button"
                            onClick={() => setSchTimeMode('preset')}
                            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                              schTimeMode === 'preset'
                                ? 'bg-accent text-black shadow-md'
                                : 'text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <Sparkles size={14} /> Quick Stage Presets
                          </button>
                          <button
                            type="button"
                            onClick={() => setSchTimeMode('custom')}
                            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                              schTimeMode === 'custom'
                                ? 'bg-accent text-black shadow-md'
                                : 'text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <Timer size={14} /> Custom Time Picker
                          </button>
                        </div>

                        <AnimatePresence mode="wait">
                          {schTimeMode === 'preset' ? (
                            <motion.div
                              key="preset-mode"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-2"
                            >
                              <span className="font-mono text-[10px] uppercase text-text-muted font-bold block">
                                Select Event Milestone (1-Tap Auto Fill)
                              </span>
                              <div className="grid grid-cols-2 gap-2.5">
                                {[
                                  { label: 'Check-in & Reg', time: '09:00 AM', hour: '09', min: '00', period: 'AM', icon: Calendar, desc: 'Athlete arrival & wristband check' },
                                  { label: 'Briefing Session', time: '09:45 AM', hour: '09', min: '45', period: 'AM', icon: Sparkles, desc: 'Rules & match allocations' },
                                  { label: 'Round 1 Kickoff', time: '10:30 AM', hour: '10', min: '30', period: 'AM', icon: Flame, desc: 'Group stage clashes begin' },
                                  { label: 'Lunch Break', time: '01:00 PM', hour: '01', min: '00', period: 'PM', icon: Coffee, desc: 'Athlete refreshment pause' },
                                  { label: 'Semifinals Clash', time: '02:30 PM', hour: '02', min: '30', period: 'PM', icon: Trophy, desc: 'Top 4 championship matches' },
                                  { label: 'Award Ceremony', time: '05:00 PM', hour: '05', min: '00', period: 'PM', icon: Award, desc: 'Trophy presentation & closing' },
                                ].map((preset, idx) => {
                                  const Icon = preset.icon;
                                  const isSelected = schTitle === preset.label;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setSchTitle(preset.label);
                                        setSchHour(preset.hour);
                                        setSchMin(preset.min);
                                        setSchPeriod(preset.period as 'AM' | 'PM');
                                        setSchTime(preset.time);
                                      }}
                                      className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                        isSelected
                                          ? 'bg-accent/15 border-accent text-accent shadow-lg ring-1 ring-accent/30'
                                          : 'bg-elevated/70 border-border-muted text-text-secondary hover:border-accent/40'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected ? 'bg-accent text-black' : 'bg-surface text-accent'}`}>
                                          <Icon size={14} />
                                        </div>
                                        <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 rounded-lg bg-surface border border-accent/20">
                                          {preset.time}
                                        </span>
                                      </div>
                                      <span className="font-mono text-xs font-bold text-text-primary block truncate">{preset.label}</span>
                                      <span className="font-mono text-[9px] text-text-muted block truncate mt-0.5">{preset.desc}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="custom-mode"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              className="space-y-4"
                            >
                              {/* DIGITAL CYBER CLOCK DISPLAY */}
                              <div className="py-3 px-4 rounded-2xl bg-gradient-to-r from-black/90 via-elevated to-black/90 border border-accent/40 flex items-center justify-between shadow-inner">
                                <div className="font-mono text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                                  <Clock size={13} className="text-accent" /> Active Time Slot
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-accent">
                                  <span className="bg-surface px-2.5 py-0.5 rounded-xl border border-accent/30">{schHour}</span>
                                  <span className="animate-pulse text-volt font-bold">:</span>
                                  <span className="bg-surface px-2.5 py-0.5 rounded-xl border border-accent/30">{schMin}</span>
                                  <span className="text-xs px-2 py-1 rounded-xl bg-accent/20 border border-accent/40 text-accent font-bold uppercase ml-1">
                                    {schPeriod}
                                  </span>
                                </div>
                              </div>

                              {/* INTERACTIVE TIME CONTROLS */}
                              <div className="space-y-3 p-4 rounded-2xl bg-elevated/60 border border-border-muted">
                                <div className="flex items-center justify-between">
                                  <label className="font-mono text-xs font-bold text-text-primary uppercase flex items-center gap-1.5">
                                    <Timer size={14} className="text-accent" /> Select Event Time <span className="text-red-500 font-bold">*</span>
                                  </label>

                                  {/* AM/PM Switch */}
                                  <div className="flex items-center p-1 rounded-xl bg-surface border border-border-muted font-mono text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSchPeriod('AM');
                                        setSchTime(`${schHour}:${schMin} AM`);
                                      }}
                                      className={`px-3 py-1 rounded-lg font-bold transition-all ${schPeriod === 'AM' ? 'bg-accent text-black shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                      AM
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSchPeriod('PM');
                                        setSchTime(`${schHour}:${schMin} PM`);
                                      }}
                                      className={`px-3 py-1 rounded-lg font-bold transition-all ${schPeriod === 'PM' ? 'bg-accent text-black shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                      PM
                                    </button>
                                  </div>
                                </div>

                                {/* Hours Grid */}
                                <div>
                                  <span className="font-mono text-[10px] uppercase text-text-muted mb-1.5 block">Hour (01 - 12)</span>
                                  <div className="grid grid-cols-6 gap-2">
                                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                                      <button
                                        key={h}
                                        type="button"
                                        onClick={() => {
                                          setSchHour(h);
                                          setSchTime(`${h}:${schMin} ${schPeriod}`);
                                        }}
                                        className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${schHour === h ? 'bg-accent text-black border-accent shadow-md scale-105' : 'bg-surface border-border-muted text-text-secondary hover:border-accent/50'}`}
                                      >
                                        {h}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Minutes Grid */}
                                <div>
                                  <span className="font-mono text-[10px] uppercase text-text-muted mb-1.5 block">Minutes</span>
                                  <div className="grid grid-cols-4 gap-2">
                                    {['00','15','30','45'].map(m => (
                                      <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                          setSchMin(m);
                                          setSchTime(`${schHour}:${m} ${schPeriod}`);
                                        }}
                                        className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${schMin === m ? 'bg-accent text-black border-accent shadow-md scale-105' : 'bg-surface border-border-muted text-text-secondary hover:border-accent/50'}`}
                                      >
                                        :{m}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* TITLE & DESCRIPTION */}
                        <div className="space-y-3 pt-2">
                          <Input
                            label="Activity / Milestone Title"
                            value={schTitle}
                            onChange={e => setSchTitle(e.target.value)}
                            placeholder="e.g. Group A Kickoff & Team Briefing"
                            required
                          />
                          <Textarea
                            label="Description / Pitch Notes (Optional)"
                            value={schDesc}
                            onChange={e => setSchDesc(e.target.value)}
                            placeholder="Add field location, rules or team details..."
                            rows={2}
                          />
                        </div>

                        {/* FIXED ACTIONS FOOTER */}
                        <div className="flex justify-end gap-3 pt-3 border-t border-border-muted bg-surface sticky bottom-0 z-10">
                          <Button variant="ghost" type="button" onClick={() => setShowSchModal(false)}>
                            Cancel
                          </Button>
                          <Button variant="primary" type="submit" icon={<Sparkles size={16} />}>
                            Save Schedule Item
                          </Button>
                        </div>

                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ATHLETES TAB ── */}
            {activeTab === 'participants' && (
              <motion.div key="participants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg tracking-wider uppercase text-text-primary">
                        Registered Athletes ({dbParticipants.length}/{maxSlots})
                      </h3>
                      <p className="font-mono text-xs text-text-muted">Manage participant roster and approvals</p>
                    </div>
                    {!lifecycle.isEnded && (
                      <Button size="sm" onClick={() => setShowAddAthleteModal(true)}>
                        <UserPlus size={14} className="mr-1" /> Add Athlete
                      </Button>
                    )}
                  </div>

                  {dbParticipants.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-border-muted rounded-2xl font-mono text-xs text-text-muted">
                      No athletes currently registered.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dbParticipants.map((p, idx) => {
                        const fullName = p.profile?.full_name || (p.user_id === currentUserId ? 'You (Organizer)' : `Athlete (${p.user_id.slice(0, 8)})`);
                        const username = p.profile?.username ? `@${p.profile.username}` : `@user_${p.user_id.slice(0, 6)}`;
                        const avatarUrl = p.profile?.avatar_url || `https://i.pravatar.cc/150?u=${p.user_id}`;
                        const displayTitle = p.user_id === currentUserId ? `${fullName} (Host)` : fullName;

                        return (
                          <div key={p.$id || idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-elevated/80 border border-border-muted font-mono text-xs hover:border-accent/30 transition-all">
                            <div className="flex items-center gap-3">
                              <Avatar src={avatarUrl} name={fullName} size="md" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-text-primary text-sm block">
                                    {displayTitle}
                                  </span>
                                  <span className="text-accent font-mono text-xs font-semibold bg-accent/10 px-2.5 py-0.5 rounded-lg border border-accent/20">
                                    {username}
                                  </span>
                                </div>
                                <span className="text-[10px] text-text-muted mt-0.5 block">
                                  {p.entry_type} entry · Joined {new Date(p.joined_at || p.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider border border-emerald-500/30">
                                {p.status}
                              </span>
                              {!lifecycle.isEnded && (
                                <button
                                  onClick={() => setRemoveTarget({ id: p.$id || p.user_id, name: `${fullName} (${username})` })}
                                  className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                                  title="Remove Athlete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Athlete Search Modal */}
                {showAddAthleteModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg p-6 rounded-3xl bg-surface border border-border-muted space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold uppercase text-text-primary">Add Athlete to Event</h3>
                        <button onClick={() => setShowAddAthleteModal(false)} className="text-text-muted hover:text-text-primary">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                          type="text"
                          value={athleteSearchQuery}
                          onChange={e => handleSearchAthletes(e.target.value)}
                          placeholder="Search athletes by name, username, or sport..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-elevated border border-border-muted font-mono text-xs text-text-primary outline-none focus:border-accent"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {isSearching ? (
                          <div className="text-center py-4 font-mono text-xs text-text-muted">Searching profiles...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="text-center py-4 font-mono text-xs text-text-muted">
                            {athleteSearchQuery ? 'No matching profiles found.' : 'Type a name or username to search.'}
                          </div>
                        ) : (
                          searchResults.map(athlete => (
                            <div key={athlete.id} className="flex items-center justify-between p-3 rounded-xl bg-elevated border border-border-muted">
                              <div className="flex items-center gap-3 font-mono text-xs">
                                <Avatar src={athlete.avatar_url} name={athlete.full_name} size="sm" />
                                <div>
                                  <div className="font-bold text-text-primary">{athlete.full_name}</div>
                                  <div className="text-[10px] text-text-muted">@{athlete.username} · {athlete.position}</div>
                                </div>
                              </div>
                              <Button size="sm" onClick={() => handleAddAthleteToEvent(athlete.id)}>
                                + Register
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Remove Confirmation Modal */}
                {removeTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm p-6 rounded-3xl bg-surface border border-red-500/40 text-center space-y-4 shadow-2xl">
                      <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                        <Trash2 size={20} />
                      </div>
                      <h3 className="font-display text-lg font-bold text-text-primary">Remove Athlete</h3>
                      <p className="font-mono text-xs text-text-secondary">
                        Are you sure you want to remove <strong className="text-text-primary">{removeTarget.name}</strong> from this event?
                      </p>
                      <div className="flex justify-center gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
                        <Button variant="primary" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleConfirmRemoveAthlete}>
                          Confirm Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── BRACKET TAB ── */}
            {activeTab === 'bracket' && (
              <motion.div key="bracket" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg tracking-wider uppercase text-accent">Tournament Bracket & Matches</h3>
                  </div>

                  {matches.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border-muted rounded-2xl space-y-2">
                      <Trophy size={32} className="mx-auto text-accent opacity-50" />
                      <div className="font-mono text-xs uppercase text-text-muted">Bracket not created yet.</div>
                      <p className="font-mono text-[10px] text-text-secondary max-w-xs mx-auto">
                        Brackets will populate automatically when match fixtures are generated for this event.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matches.map((m, idx) => (
                        <div key={m.$id || idx} className="p-4 rounded-xl bg-elevated border border-border-muted flex justify-between items-center font-mono text-xs">
                          <div>
                            <span className="text-text-primary font-bold">Match #{idx + 1}</span>
                            <span className="text-text-muted block text-[10px]">{m.sport || rawEvent.sport} · Status: {m.status}</span>
                          </div>
                          <span className="text-accent font-bold">{m.result || 'Pending'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── ANNOUNCEMENTS TAB ── */}
            {activeTab === 'announcements' && (
              <motion.div key="announcements" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                {/* Publish Form */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-4">
                  <h3 className="font-display text-lg tracking-wider uppercase text-accent flex items-center gap-2">
                    <Send size={16} /> Create Broadcast Announcement
                  </h3>
                  <p className="font-mono text-xs text-text-muted">
                    Publishing an announcement saves it to event history and immediately sends a push notification to all registered athletes.
                  </p>

                  <form onSubmit={handlePublishAnnouncement} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Input label="Title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Schedule update, venue change..." required />
                      </div>
                      <div>
                        <Select
                          label="Category"
                          value={annCategory}
                          onChange={e => setAnnCategory(e.target.value as any)}
                          options={[
                            { value: 'GENERAL', label: 'General' },
                            { value: 'SCHEDULE', label: 'Schedule' },
                            { value: 'IMPORTANT', label: 'Important' },
                            { value: 'MATCH', label: 'Match' },
                            { value: 'VENUE', label: 'Venue' },
                            { value: 'REGISTRATION', label: 'Registration' },
                          ]}
                        />
                      </div>
                    </div>
                    <Textarea label="Message" value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Full announcement details..." rows={3} required />

                    <div className="flex justify-end pt-1">
                      <Button variant="primary" type="submit" disabled={isPublishing}>
                        {isPublishing ? 'Publishing...' : 'Publish Announcement'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Published Announcements List */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-3">
                  <h3 className="font-display text-base tracking-wider uppercase text-text-primary">
                    Published Announcements ({announcements.length})
                  </h3>

                  {announcements.length === 0 ? (
                    <div className="text-center py-8 font-mono text-xs text-text-muted border border-dashed border-border-muted rounded-xl">
                      No announcements published yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((ann) => (
                        <div key={ann.id} className="p-4 rounded-xl bg-elevated border border-border-muted space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-md font-mono text-[9px] font-bold bg-accent/20 text-accent uppercase">
                              {ann.category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] text-text-muted">
                                {new Date(ann.createdAt).toLocaleDateString()}
                              </span>
                              <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1 text-text-muted hover:text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-sm text-text-primary">{ann.title}</h4>
                          <p className="font-mono text-xs text-text-secondary">{ann.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── EDIT INFO TAB ── */}
            {activeTab === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                <div className="glass rounded-[22px] p-6 border border-border-muted space-y-4">
                  <h3 className="font-display text-lg tracking-wider uppercase border-b border-border-muted pb-2 text-accent">Edit Event Details</h3>
                  
                  <Input label="Event Name" value={title} onChange={e => setTitle(e.target.value)} required />
                  <Textarea label="Event Description" value={description} onChange={e => setDescription(e.target.value)} rows={4} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <Select
                      label="Format"
                      value={format}
                      onChange={e => setFormat(e.target.value as EventFormat)}
                      options={[
                        { value: 'tournament', label: 'Tournament' },
                        { value: 'league', label: 'League' },
                        { value: 'solo', label: 'Solo' },
                        { value: 'team', label: 'Team' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Venue" value={venue} onChange={e => setVenue(e.target.value)} />
                    <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Sport Category"
                      value={sport}
                      onChange={e => setSport(e.target.value as SportCategory)}
                      options={SPORT_CATEGORIES.map(s => ({ value: s.id, label: s.label }))}
                    />
                    <Select
                      label="Skill Level"
                      value={skillLevel}
                      onChange={e => setSkillLevel(e.target.value as ExperienceLevel)}
                      options={[
                        { value: 'beginner', label: 'Beginner' },
                        { value: 'amateur', label: 'Amateur' },
                        { value: 'semi-pro', label: 'Semi-Pro' },
                        { value: 'pro', label: 'Pro' },
                        { value: 'elite', label: 'Elite' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input label="Max Players" type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
                    <Input label="Prize Pool" value={prizePool} onChange={e => setPrizePool(e.target.value)} />
                    <Input label="Entry Fee" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
                  </div>

                  {/* Banner Image Configuration Section */}
                  <div className="space-y-3 pt-3 border-t border-border-muted">
                    <label className="font-mono text-xs font-bold text-text-primary uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><ImageIcon size={14} className="text-accent" /> Event Banner Image</span>
                      {isUploadingBanner && <span className="text-[10px] text-accent animate-pulse">Uploading to Appwrite...</span>}
                    </label>

                    {/* Live Preview */}
                    <div className="h-40 rounded-2xl overflow-hidden relative border border-border-muted bg-elevated">
                      <img src={bannerImage || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'} alt="Banner Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                        <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur font-mono text-[10px] font-bold text-white uppercase tracking-wider">
                          Live Banner Preview
                        </span>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <label className="px-4 py-2.5 rounded-xl bg-elevated border border-border-muted hover:border-accent text-xs font-mono font-bold uppercase cursor-pointer flex items-center justify-center gap-2 transition-all flex-shrink-0">
                        <Upload size={14} className="text-accent" />
                        <span>Upload Custom Image</span>
                        <input type="file" accept="image/*" onChange={handleBannerFileSelect} className="hidden" />
                      </label>

                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={bannerImage}
                          onChange={e => { setBannerImage(e.target.value); setBannerFile(null); }}
                          onPaste={e => {
                            const pasted = e.clipboardData.getData('text');
                            if (pasted) {
                              setBannerImage(pasted.trim());
                              setBannerFile(null);
                            }
                          }}
                          placeholder="Or paste direct banner image URL..."
                          className="flex-1 rounded-xl px-4 py-2.5 font-mono text-xs bg-base border border-border-muted text-text-primary outline-none focus:border-accent"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handlePasteBannerUrl}
                          className="flex-shrink-0"
                          title="Paste link from clipboard"
                        >
                          <Clipboard size={14} className="mr-1 text-accent" /> Paste Link
                        </Button>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-mono text-[10px] uppercase text-text-muted">Or Pick Sport Preset:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Football Turf', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80' },
                          { label: 'Basketball Arena', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80' },
                          { label: 'Padel / Tennis', url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
                          { label: 'Night Lights', url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800&q=80' },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => { setBannerImage(preset.url); setBannerFile(null); }}
                            className={`p-1.5 rounded-xl border text-left font-mono text-[10px] flex items-center gap-2 transition-all ${
                              bannerImage === preset.url ? 'border-accent bg-accent/15 text-accent' : 'border-border-muted bg-elevated text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <img src={preset.url} alt={preset.label} className="w-8 h-6 rounded-md object-cover flex-shrink-0" />
                            <span className="truncate">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-border-muted">
                    <Button variant="primary" disabled={isSavingDetails || !title} onClick={handleSaveDetails}>
                      {isSavingDetails ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── RULES & PRIVACY TAB ── */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                
                {/* Rules Editor */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-3">
                  <h3 className="font-display text-base tracking-wider uppercase text-accent">Edit Rules & Guidelines</h3>
                  <div className="space-y-2">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="font-mono text-xs text-accent font-bold">#{idx + 1}</span>
                        <input
                          type="text"
                          value={rule}
                          onChange={e => {
                            const next = [...rules];
                            next[idx] = e.target.value;
                            setRules(next);
                          }}
                          className="flex-1 rounded-xl px-4 py-2 font-mono text-xs bg-base border border-border-muted text-text-primary outline-none focus:border-accent"
                        />
                        <button onClick={() => setRules(rules.filter((_, ri) => ri !== idx))} className="text-text-muted hover:text-red-500 p-1.5">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => setRules([...rules, ''])} className="flex items-center gap-1.5 font-mono text-[10px] font-bold px-3 py-1.5 rounded-lg border border-dashed border-border-muted text-text-secondary hover:border-accent transition-all">
                      <Plus size={11} /> Add Rule / Requirement
                    </button>
                  </div>
                </div>

                {/* Event Settings Toggles */}
                <div className="glass rounded-[22px] p-5 border border-border-muted space-y-4">
                  <h3 className="font-display text-base tracking-wider uppercase text-text-primary">Event Access Controls</h3>
                  
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-elevated border border-border-muted">
                    <div className="font-mono text-xs flex-1">
                      <p className="font-bold flex items-center gap-1.5 text-text-primary">
                        {isPublic ? <Eye size={13} className="text-accent" /> : <Lock size={13} className="text-orange-500" />}
                        Public Visibility
                      </p>
                      <p className="text-[9px] text-text-secondary mt-0.5">Toggle whether the event shows in main browse and feeds</p>
                    </div>
                    <button onClick={() => setIsPublic(!isPublic)} className={`px-4 py-1.5 rounded-xl font-mono text-[10px] font-bold border ${isPublic ? 'bg-accent/15 border-accent text-accent' : 'bg-surface border-border-muted text-text-secondary'}`}>
                      {isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-elevated border border-border-muted">
                    <div className="font-mono text-xs flex-1">
                      <p className="font-bold flex items-center gap-1.5 text-text-primary">
                        <Shield size={13} className="text-accent" /> Invite-only Registration
                      </p>
                      <p className="text-[9px] text-text-secondary mt-0.5">Require host invitation to join this event</p>
                    </div>
                    <button onClick={() => setIsInviteOnly(!isInviteOnly)} className={`px-4 py-1.5 rounded-xl font-mono text-[10px] font-bold border ${isInviteOnly ? 'bg-accent/15 border-accent text-accent' : 'bg-surface border-border-muted text-text-secondary'}`}>
                      {isInviteOnly ? 'INVITE ONLY' : 'OPEN ACCESS'}
                    </button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="primary" onClick={handleSaveDetails}>
                      Confirm Policies
                    </Button>
                  </div>
                </div>

                {/* Danger Zone: Event Cancellation */}
                <div className="glass rounded-[22px] p-5 border border-red-500/30 space-y-3 bg-red-500/5">
                  <h3 className="font-display text-base tracking-wider uppercase text-red-500 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Zone: Event Status Controls
                  </h3>
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-elevated border border-border-muted">
                    <div className="font-mono text-xs flex-1">
                      <p className="font-bold text-text-primary">
                        {rawEvent.status === 'cancelled' ? 'Event is Currently Cancelled' : 'Cancel Event Registration'}
                      </p>
                      <p className="text-[9px] text-text-secondary mt-0.5">
                        {rawEvent.status === 'cancelled'
                          ? 'Restoring the event will reactivate registrations for athletes.'
                          : 'Cancelling this event notifies all registered participants and locks registrations.'}
                      </p>
                    </div>
                    <Button
                      variant={rawEvent.status === 'cancelled' ? 'primary' : 'danger'}
                      size="sm"
                      onClick={() => setShowCancelModal(true)}
                    >
                      {rawEvent.status === 'cancelled' ? 'Restore Event' : 'Cancel Event'}
                    </Button>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Cancel Event Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-surface border border-red-500/40 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-display text-lg font-bold text-text-primary uppercase tracking-wide">
              {rawEvent.status === 'cancelled' ? 'Restore Event?' : 'Cancel Event?'}
            </h3>
            <p className="font-mono text-xs text-text-secondary">
              {rawEvent.status === 'cancelled'
                ? `Are you sure you want to restore "${rawEvent.title}"? This will reactivate the event for players.`
                : `Are you sure you want to cancel "${rawEvent.title}"? This will notify all registered participants and mark the event as CANCELLED.`}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowCancelModal(false)} disabled={isCancelling}>
                Close
              </Button>
              <Button
                variant={rawEvent.status === 'cancelled' ? 'primary' : 'danger'}
                onClick={handleToggleCancelEvent}
                disabled={isCancelling}
              >
                {isCancelling ? 'Updating...' : rawEvent.status === 'cancelled' ? 'Confirm Restore' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Fields Modal */}
      <MissingFieldsModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        missingFields={missingFields}
      />

    </div>
  );
};
