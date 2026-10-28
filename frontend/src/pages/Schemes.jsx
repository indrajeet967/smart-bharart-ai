import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { 
  BookOpen, Search, Filter, ExternalLink, CheckCircle, Sparkles,
  Building2, Users, IndianRupee, ShieldAlert, Award, FileText,
  ChevronRight, MapPin, Globe, ArrowUpRight, Info, X, Loader2
} from 'lucide-react';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { GOVERNMENT_SCHEMES } from '../data/governmentKnowledge';

// ─── Category colours ──────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  Agriculture: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  Healthcare: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  Housing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Education: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  Employment: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  Insurance: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  Pension: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  Welfare: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300',
};

// Level badge
function LevelBadge({ level }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
      level === 'Central'
        ? 'bg-navy-800/10 dark:bg-navy-400/20 text-navy-700 dark:text-navy-300'
        : 'bg-saffron-500/10 text-saffron-700 dark:text-saffron-400'
    }`}>
      {level === 'Central' ? '🏛️ Central Govt' : `🏠 ${level}`}
    </span>
  );
}

// Merge backend schemes with local knowledge base
function mergeSchemes(apiSchemes, localSchemes) {
  const seen = new Set();
  const merged = [];
  for (const s of [...apiSchemes, ...localSchemes]) {
    const key = (s.id || s._id || s.title || '').toLowerCase().replace(/\s+/g, '-');
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(s);
    }
  }
  return merged;
}

export default function Schemes() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { selectedLocation } = useLocation();
  const toast = useToast();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All'); // 'All' | 'Central' | 'State'
  const [activeScheme, setActiveScheme] = useState(null);

  // Eligibility matcher
  const [showMatcher, setShowMatcher] = useState(false);
  const [matchProfile, setMatchProfile] = useState({
    age: profile?.age || '',
    gender: profile?.gender || 'All',
    income: '',
    occupation: 'Any',
    category: profile?.category || 'All',
  });
  const [matchResults, setMatchResults] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Effective state for filtering (user's location OR profile state)
  const effectiveState = selectedLocation?.state || profile?.state || '';

  // ── Load schemes ────────────────────────────────────────────────────────
  useEffect(() => {
    const loadSchemes = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/schemes/all', { timeout: 4000 });
        const apiSchemes = res.data || [];
        setSchemes(mergeSchemes(apiSchemes, GOVERNMENT_SCHEMES));
      } catch {
        // Use local knowledge base when backend is offline
        setSchemes(GOVERNMENT_SCHEMES);
      } finally {
        setLoading(false);
      }
    };
    loadSchemes();
  }, []);

  // ── Categories list derived from data ─────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set(schemes.map(s => s.category));
    return ['All', ...Array.from(cats).sort()];
  }, [schemes]);

  // ── Filter & search ─────────────────────────────────────────────────
  const displaySchemes = useMemo(() => {
    let result = schemes;

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(s => s.category === selectedCategory);
    }

    // Central/State filter
    if (selectedLevel === 'Central') {
      result = result.filter(s => s.level === 'Central');
    } else if (selectedLevel === 'State') {
      result = result.filter(s => s.level !== 'Central');
    }

    // Location-based state filter (auto-apply)
    if (effectiveState) {
      result = result.filter(s =>
        s.state === 'All' ||
        (s.state || '').toLowerCase() === effectiveState.toLowerCase()
      );
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.tags || []).some(tag => tag.includes(q)) ||
        (s.beneficiaries || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [schemes, selectedCategory, selectedLevel, effectiveState, searchQuery]);

  // ── Eligibility Matcher ─────────────────────────────────────────────
  const handleMatchEligibility = async () => {
    if (matchProfile.age === '' || matchProfile.income === '') {
      toast.error('Enter your age and annual household income to compare available eligibility rules.');
      return;
    }

    const matcherProfile = {
      ...matchProfile,
      age: Number(matchProfile.age),
      income: Number(matchProfile.income),
      state: effectiveState || 'All'
    };

    setMatchLoading(true);
    try {
      const res = await axios.post('/api/schemes/recommend', matcherProfile, { timeout: 5000 });
      const apiMatches = res.data.potentialMatches || [];
      const localMatches = GOVERNMENT_SCHEMES.filter(s => {
        if (s.eligibilityVerified !== true) return false;
        if (s.eligibility?.ageMin && matcherProfile.age < s.eligibility.ageMin) return false;
        if (s.eligibility?.ageMax && matcherProfile.age > s.eligibility.ageMax) return false;
        if (s.eligibility?.incomeMax && matcherProfile.income > s.eligibility.incomeMax) return false;
        return true;
      });
      setMatchResults(mergeSchemes(apiMatches, localMatches));
    } catch {
      const localMatches = GOVERNMENT_SCHEMES.filter(s => {
        if (s.eligibilityVerified !== true) return false;
        if (s.eligibility?.ageMin && matcherProfile.age < s.eligibility.ageMin) return false;
        if (s.eligibility?.ageMax && matcherProfile.age > s.eligibility.ageMax) return false;
        if (s.eligibility?.incomeMax && matcherProfile.income > s.eligibility.incomeMax) return false;
        return true;
      });
      setMatchResults(localMatches);
    } finally {
      setMatchLoading(false);
    }
  };

  const schemesToShow = matchResults || displaySchemes;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Header */}
      <PageHeader
        title="Government Welfare Schemes"
        description="Search a maintained catalog of central and state schemes. Confirm current rules and application availability on the linked official portal."
        icon={BookOpen}
        badge="Official links · verify current rules"
        actions={
          <div className="flex gap-2">
            <Button variant="saffron" size="sm" icon={Sparkles} onClick={() => setShowMatcher(true)}>
              Find My Schemes
            </Button>
            <a href="https://www.myscheme.gov.in/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" icon={ExternalLink}>
                myScheme Portal
              </Button>
            </a>
          </div>
        }
      />

      {/* Location Context Banner */}
      {effectiveState && (
        <div className="p-3.5 rounded-xl bg-saffron-500/10 border border-saffron-500/30 flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
          <MapPin size={13} className="text-saffron-500 shrink-0" />
          Showing schemes for <strong>{effectiveState}</strong> (All India schemes + state-specific).
          {matchResults && (
            <button
              onClick={() => setMatchResults(null)}
              className="ml-auto flex items-center gap-1 text-saffron-600 dark:text-saffron-400 hover:underline font-bold"
            >
              <X size={12} /> Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Search + Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scheme name, category, or beneficiary..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
          />
        </div>

        {/* Level Filter */}
        <select
          value={selectedLevel}
          onChange={e => setSelectedLevel(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
        >
          <option value="All">All Levels</option>
          <option value="Central">Central Govt</option>
          <option value="State">State Govt</option>
        </select>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              selectedCategory === cat
                ? 'bg-navy-800 text-white border-navy-800 shadow-sm dark:bg-saffron-500 dark:border-saffron-500'
                : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-850'
            }`}
          >
            {cat} {cat !== 'All' && (
              <span className="opacity-60">({schemes.filter(s => s.category === cat).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {loading ? 'Loading schemes...' : (
            matchResults
              ? `${matchResults.length} potential matches based on the rules currently in the catalog`
              : `${displaySchemes.length} schemes${effectiveState ? ` for ${effectiveState}` : ''}`
          )}
        </span>
        {matchResults && (
          <button
            onClick={() => setMatchResults(null)}
            className="text-saffron-500 font-bold hover:underline flex items-center gap-1"
          >
            <X size={12} /> Clear matcher results
          </button>
        )}
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin text-saffron-500" />
          <span className="text-sm text-slate-500 font-semibold">Loading government schemes...</span>
        </div>
      ) : schemesToShow.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Schemes Found"
          description="Try adjusting filters, search query, or clearing state filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schemesToShow.map((scheme, idx) => {
            const catStyle = CATEGORY_STYLES[scheme.category] || CATEGORY_STYLES.default;
            return (
              <div
                key={scheme.id || scheme._id || idx}
                onClick={() => setActiveScheme(scheme)}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 hover:shadow-lg hover:border-saffron-300 dark:hover:border-saffron-600/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Category + Level */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${catStyle}`}>
                      {scheme.category}
                    </span>
                    <LevelBadge level={scheme.level || 'Central'} />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-navy-800 dark:text-white leading-snug group-hover:text-saffron-600 dark:group-hover:text-saffron-400 transition-colors">
                    {scheme.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {scheme.description}
                  </p>

                  {/* Benefits Highlight */}
                  {scheme.benefits && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <IndianRupee size={11} />
                        {typeof scheme.benefits === 'string' ? scheme.benefits.substring(0, 90) + (scheme.benefits.length > 90 ? '...' : '') : 'See details'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <Globe size={11} />
                    <span>{scheme.state === 'All' ? 'All India' : scheme.state || 'All India'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-saffron-600 dark:text-saffron-400 flex items-center gap-0.5">
                    View Details <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheme Detail Modal */}
      {activeScheme && (
        <Modal
          isOpen={!!activeScheme}
          onClose={() => setActiveScheme(null)}
          title={activeScheme.title}
          subtitle={`${activeScheme.category} • ${activeScheme.level || 'Central'} • ${activeScheme.state === 'All' ? 'All India' : activeScheme.state}`}
          size="lg"
          footer={
            <div className="flex flex-wrap gap-2">
              {(activeScheme.applyUrl || activeScheme.apply_url) && (
                <a href={activeScheme.applyUrl || activeScheme.apply_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="saffron" icon={ExternalLink}>Apply on Official Portal</Button>
                </a>
              )}
              {(activeScheme.statusUrl) && (
                <a href={activeScheme.statusUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" icon={ArrowUpRight}>Check Status</Button>
                </a>
              )}
              {(activeScheme.officialSource) && (
                <a href={activeScheme.officialSource} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" icon={Globe}>Official Details</Button>
                </a>
              )}
            </div>
          }
        >
          <div className="space-y-5 text-xs text-slate-700 dark:text-slate-200">

            {/* Benefits */}
            {activeScheme.benefits && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Benefits listed in catalog · verify on official source</p>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 leading-relaxed">{activeScheme.benefits}</p>
              </div>
            )}

            {/* Eligibility */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Eligibility</p>
              {activeScheme.eligibility?.criteria && (
                <p className="leading-relaxed">{activeScheme.eligibility.criteria}</p>
              )}
              {activeScheme.eligibility?.who && (
                <p className="leading-relaxed"><strong>Who:</strong> {activeScheme.eligibility.who}</p>
              )}
              {activeScheme.eligibility?.incomeMax && (
                <p className="mt-1"><strong>Income Limit:</strong> ₹{activeScheme.eligibility.incomeMax.toLocaleString('en-IN')}/year</p>
              )}
              {activeScheme.eligibility?.ageMin && (
                <p><strong>Age:</strong> {activeScheme.eligibility.ageMin}
                  {activeScheme.eligibility.ageMax ? `–${activeScheme.eligibility.ageMax}` : '+'} years</p>
              )}
            </div>

            {/* Required Documents */}
            {activeScheme.requiredDocuments?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Required Documents</p>
                <ul className="space-y-1">
                  {activeScheme.requiredDocuments.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Application Process */}
            {(activeScheme.applicationProcess || activeScheme.applicationMethod) && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">How to Apply</p>
                <p className="leading-relaxed">{activeScheme.applicationProcess || activeScheme.applicationMethod}</p>
              </div>
            )}

            {/* Helpline */}
            {activeScheme.helpline && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <ShieldAlert size={15} className="text-saffron-500" />
                <div>
                  <p className="font-bold text-[10px] text-slate-400 uppercase">Helpline</p>
                  <a href={`tel:${activeScheme.helpline}`} className="font-bold text-saffron-600 dark:text-saffron-400 hover:underline">
                    {activeScheme.helpline}
                  </a>
                </div>
              </div>
            )}

            {/* Source */}
            <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
              <Info size={11} />
              {activeScheme.officialSource ? (
                <>Catalog source: <a href={activeScheme.officialSource} target="_blank" rel="noopener noreferrer" className="underline">Open source</a>.</>
              ) : 'No official source link is listed for this entry.'}
              {' '}Catalog information is not live-verified; confirm current rules with the responsible authority.
            </p>
          </div>
        </Modal>
      )}

      {/* Eligibility Matcher Modal */}
      <Modal
        isOpen={showMatcher}
        onClose={() => { setShowMatcher(false); setMatchResults(null); }}
        title="🎯 Smart Scheme Eligibility Matcher"
        subtitle="Provide details voluntarily to compare with catalog rules. A potential match is not an approval."
        footer={
          <div className="flex gap-2">
            {matchResults && (
              <Button variant="ghost" onClick={() => setMatchResults(null)}>Clear Results</Button>
            )}
            <Button variant="saffron" onClick={handleMatchEligibility} isLoading={matchLoading} icon={Sparkles}>
              Find Matching Schemes
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            The current catalog has no independently verified eligibility rules. The matcher will not claim that a scheme fits; use the official source to check your circumstances.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Age</label>
              <input
                type="number"
                value={matchProfile.age}
                onChange={e => setMatchProfile(p => ({ ...p, age: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                min={1} max={100}
              />
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Annual Income (₹)</label>
              <input
                type="number"
                value={matchProfile.income}
                onChange={e => setMatchProfile(p => ({ ...p, income: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
                step={10000}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Gender</label>
              <select
                value={matchProfile.gender}
                onChange={e => setMatchProfile(p => ({ ...p, gender: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
              >
                <option value="All">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Occupation</label>
              <select
                value={matchProfile.occupation}
                onChange={e => setMatchProfile(p => ({ ...p, occupation: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
              >
                <option value="Any">Any</option>
                <option value="Farmer">Farmer</option>
                <option value="Student">Student</option>
                <option value="Labourer">Labourer</option>
                <option value="Salaried">Salaried Employee</option>
                <option value="Self-employed">Self-Employed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Social Category</label>
            <select
              value={matchProfile.category}
              onChange={e => setMatchProfile(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 focus:outline-none focus:ring-2 focus:ring-saffron-500/30"
            >
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="EWS">EWS (Economically Weaker Section)</option>
              <option value="Minority">Minority</option>
            </select>
          </div>

          {matchResults && (
            <Alert variant="success" title={`✅ Found ${matchResults.length} matching scheme${matchResults.length !== 1 ? 's' : ''}`}>
              Close this dialog to see the filtered results below.
            </Alert>
          )}
        </div>
      </Modal>

    </div>
  );
}
