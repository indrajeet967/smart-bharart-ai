import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, User, HelpCircle, GraduationCap, DollarSign, Briefcase, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { CardSkeleton } from '../components/Skeleton';
import confetti from 'canvas-confetti';

export default function Schemes() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  // Wizard state: Age, Gender, State, Income, Occupation, Category, Disability, Student
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('All');
  const [stateName, setStateName] = useState(profile?.state || 'Delhi');
  const [income, setIncome] = useState(200000);
  const [occupation, setOccupation] = useState('Farmer');
  const [category, setCategory] = useState('General');
  const [disability, setDisability] = useState(false);
  const [student, setStudent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [recommendedSchemes, setRecommendedSchemes] = useState([]);
  const [narrativeSummary, setNarrativeSummary] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [appliedScheme, setAppliedScheme] = useState(null);

  const handleRecommend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowResults(false);

    try {
      const res = await axios.post('/api/schemes/recommend', {
        age,
        gender,
        state: stateName,
        income,
        occupation,
        category,
        disability,
        student
      });

      setRecommendedSchemes(res.data.eligibleSchemes || []);
      setNarrativeSummary(res.data.recommendation || '');
      setShowResults(true);

      // Trigger success confetti if matches found
      if (res.data.eligibleSchemes?.length > 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch scheme recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (schemeTitle) => {
    setAppliedScheme(schemeTitle);
    setTimeout(() => {
      setAppliedScheme(null);
      alert(`Simulation Complete: Application submitted for "${schemeTitle}". The department will verify details from your secure Digital Locker.`);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
          <BookOpen className="text-saffron-500" />
          Government Schemes Recommender
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Enter your demographic details to discover financial support, scholarships, and welfare programs you qualify for.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Details Form (Left Column) */}
        <div className="lg:col-span-1 glass bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white border-b border-slate-100 dark:border-navy-800 pb-2">
            Demographic Profile Wizard
          </h3>
          
          <form onSubmit={handleRecommend} className="space-y-4 text-xs font-semibold text-slate-500">
            <div className="space-y-1">
              <label className="uppercase tracking-wider">Age (Years)</label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500"
              />
            </div>

            <div className="space-y-1">
              <label className="uppercase tracking-wider">Gender</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500"
              >
                <option value="All">All / Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="uppercase tracking-wider">State of Residence</label>
              <input 
                type="text" 
                value={stateName} 
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Madhya Pradesh, Delhi, etc."
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500"
              />
            </div>

            <div className="space-y-1">
              <label className="uppercase tracking-wider">Annual Family Income (₹)</label>
              <input 
                type="number" 
                value={income} 
                onChange={(e) => setIncome(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500"
              />
            </div>

            <div className="space-y-1">
              <label className="uppercase tracking-wider">Occupation</label>
              <select 
                value={occupation} 
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500"
              >
                <option value="Farmer">Farmer / Agriculture</option>
                <option value="Laborer">Daily Wage Laborer</option>
                <option value="Business Owner">Business Owner</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Any">Other / Professional</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="uppercase tracking-wider">Social Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-navy-800 rounded-lg bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-saffron-500"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={disability} 
                  onChange={(e) => setDisability(e.target.checked)}
                  className="rounded text-saffron-500 focus:ring-saffron-500 dark:bg-navy-950 border-slate-200 dark:border-navy-800"
                />
                <span>Disabled (PWD)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={student} 
                  onChange={(e) => setStudent(e.target.checked)}
                  className="rounded text-saffron-500 focus:ring-saffron-500 dark:bg-navy-950 border-slate-200 dark:border-navy-800"
                />
                <span>Active Student</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy-800 dark:bg-saffron-500 hover:bg-navy-900 dark:hover:bg-saffron-600 text-white font-bold rounded-lg shadow transition-all duration-200 flex items-center justify-center gap-1.5 text-xs"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Match Eligible Schemes</>}
            </button>
          </form>
        </div>

        {/* Recommendations Output (Right 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Narrative Summary card */}
          {showResults && (
            <div className="p-6 rounded-2xl glass bg-saffron-50/50 dark:bg-navy-900 border border-saffron-200/50 dark:border-navy-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-saffron-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-3 text-saffron-600 dark:text-saffron-400 font-extrabold font-outfit text-sm">
                <Sparkles size={16} />
                <span>AI Personal Qualification Summary</span>
              </div>
              <div className="prose dark:prose-invert text-xs text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line font-medium">
                {narrativeSummary}
              </div>
            </div>
          )}

          {/* Cards list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : showResults ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold font-outfit text-navy-800 dark:text-white flex items-center gap-2">
                Eligible Schemes Match list ({recommendedSchemes.length})
              </h3>
              
              {recommendedSchemes.length === 0 ? (
                <div className="p-8 text-center glass bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 space-y-2">
                  <p className="text-sm font-semibold text-slate-400">No exact matches found in local directory.</p>
                  <p className="text-xs text-slate-500">Try modifying income limits, category, or occupations to query broader national criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendedSchemes.map((scheme) => (
                    <div 
                      key={scheme._id} 
                      className="p-6 rounded-2xl glass hover-card-trigger bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] bg-slate-100 dark:bg-navy-950 px-2 py-0.5 rounded font-bold text-slate-500 uppercase tracking-wider">
                            {scheme.category}
                          </span>
                          <span className="text-[9px] bg-saffron-500/10 text-saffron-600 dark:text-saffron-400 px-1.5 py-0.5 rounded font-bold">
                            {scheme.state === 'All' ? 'National' : scheme.state}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-navy-800 dark:text-white leading-snug">{scheme.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-450 line-clamp-3">{scheme.description}</p>
                        
                        <div className="p-3 bg-slate-50 dark:bg-navy-950 rounded-xl space-y-1.5 border border-slate-100 dark:border-navy-850">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Benefits Summary</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">{scheme.benefits}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleApply(scheme.title)}
                        disabled={appliedScheme === scheme.title}
                        className="mt-6 w-full py-2 bg-navy-800 dark:bg-navy-950 dark:hover:bg-navy-900 text-white font-bold rounded-lg text-xs shadow hover:bg-navy-900 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {appliedScheme === scheme.title ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Verify & Apply via Locker</>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center glass bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 flex flex-col items-center justify-center space-y-3">
              <span className="text-4xl animate-bounce">📋</span>
              <h3 className="text-base font-bold text-navy-800 dark:text-white">Awaiting Profile Input</h3>
              <p className="text-xs text-slate-400 max-w-sm">Fill in the Demographic Profile Wizard details on the left and submit to search verified central/state scheme databases.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
