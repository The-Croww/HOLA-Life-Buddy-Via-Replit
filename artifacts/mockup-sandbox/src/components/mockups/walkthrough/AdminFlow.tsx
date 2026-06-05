import React from 'react';
import { 
  ArrowRight, LayoutDashboard, Users, Bell, MessageSquare, 
  FileText, Calendar, Search, TrendingUp, TrendingDown, Minus,
  Activity, CheckCircle2, AlertTriangle, ChevronRight, ActivitySquare,
  MoreVertical, ShieldAlert
} from 'lucide-react';

const BrowserFrame = ({ children, url = "admin.holalifebuddy.com" }: { children: React.ReactNode, url?: string }) => (
  <div className="flex flex-col w-[800px] h-[450px] bg-white rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 shrink-0">
    <div className="h-10 bg-[#f1f1f1] border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="bg-white text-xs text-gray-500 px-3 py-1 rounded-md border border-gray-200 flex items-center justify-center w-64 shadow-sm">
          <span className="truncate">{url}</span>
        </div>
      </div>
      <div className="w-12"></div>
    </div>
    <div className="flex-1 flex overflow-hidden relative bg-gray-50">
      {children}
    </div>
  </div>
);

const Sidebar = ({ active = "dashboard", badge = 0 }: { active?: string, badge?: number }) => (
  <div className="w-48 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
    <div className="h-14 flex items-center px-4 border-b border-gray-100">
      <div className="w-6 h-6 rounded-md bg-[#0a0a0a] flex items-center justify-center mr-2">
        <Heart className="w-3 h-3 text-[#3DD68C]" />
      </div>
      <span className="font-bold text-sm text-[#0a0a0a] tracking-tight">HOLA! Admin</span>
    </div>
    <div className="flex-1 py-4 flex flex-col gap-1 px-3">
      <NavItem icon={<LayoutDashboard size={14} />} label="Dashboard" isActive={active === 'dashboard'} />
      <NavItem icon={<Users size={14} />} label="Patients" isActive={active === 'patients'} />
      <NavItem 
        icon={<Bell size={14} />} 
        label="Alerts" 
        isActive={active === 'alerts'} 
        badge={badge > 0 ? badge : undefined} 
      />
      <NavItem icon={<MessageSquare size={14} />} label="Messages" isActive={active === 'messages'} />
      <NavItem icon={<FileText size={14} />} label="Reports" isActive={active === 'reports'} />
      <NavItem icon={<Calendar size={14} />} label="Schedule" isActive={active === 'schedule'} />
    </div>
    <div className="p-4 border-t border-gray-100 mt-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Dr+Rivera&background=0D8ABC&color=fff" alt="Dr Rivera" />
        </div>
        <div>
          <div className="text-xs font-medium">Dr. Rivera</div>
          <div className="text-[10px] text-gray-500">Clinician</div>
        </div>
      </div>
    </div>
  </div>
);

const NavItem = ({ icon, label, isActive, badge }: { icon: React.ReactNode, label: string, isActive?: boolean, badge?: number }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${isActive ? 'bg-[#3DD68C]/10 text-[#0a0a0a] font-medium' : 'text-gray-500 hover:bg-gray-50'}`}>
    <div className="flex items-center gap-2">
      <div className={isActive ? 'text-[#3DD68C]' : 'text-gray-400'}>{icon}</div>
      <span>{label}</span>
    </div>
    {badge && (
      <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none flex items-center justify-center">
        {badge}
      </div>
    )}
  </div>
);

const Heart = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
)

export function AdminFlow() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-auto overflow-y-hidden flex flex-col items-start selection:bg-[#3DD68C]/30">
      
      {/* Header */}
      <div className="w-full shrink-0 pt-16 pb-12 px-12 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#3DD68C] mb-6">
          <ActivitySquare size={14} />
          <span>Product Walkthrough</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          HOLA! Life Buddy <span className="text-gray-500 font-light">· Clinician Portal</span>
        </h1>
        <p className="text-gray-400 max-w-xl text-lg">
          A dedicated workspace for therapists to monitor patient wellbeing, track mood trends, and receive automated risk alerts.
        </p>
      </div>

      {/* Slides Container */}
      <div className="flex items-center gap-16 px-16 pb-24 shrink-0 min-w-max">
        
        {/* Screen 1: Login */}
        <div className="flex flex-col gap-6 w-[800px]">
          <div className="flex flex-col gap-2 pl-2">
            <div className="text-xs font-bold text-[#3DD68C] tracking-widest uppercase">01 · Sign In</div>
            <div className="text-gray-400 text-sm">Secure clinician access</div>
          </div>
          <BrowserFrame>
            <div className="flex w-full h-full bg-white">
              {/* Left Panel */}
              <div className="w-1/2 p-12 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] flex items-center justify-center">
                    <Heart className="w-4 h-4 text-[#3DD68C]" />
                  </div>
                  <span className="font-bold text-lg text-[#0a0a0a] tracking-tight">HOLA! Life Buddy</span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinician Portal</h2>
                <p className="text-sm text-gray-500 mb-8">Sign in to manage your patients and monitor alerts.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
                    <input type="email" value="doctor@example.com" readOnly className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value="••••••••" readOnly className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:outline-none" />
                  </div>
                  <button className="w-full bg-[#0a0a0a] hover:bg-black text-white font-medium py-2.5 rounded-md text-sm transition-colors mt-2">
                    Sign In
                  </button>
                </div>
              </div>
              
              {/* Right Panel */}
              <div className="w-1/2 bg-[#0a0a0a] p-12 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3DD68C]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                
                <div className="relative z-10 text-white mt-10">
                  <h3 className="text-3xl font-light leading-tight mb-4 text-white">Supporting mental wellness, <span className="font-bold text-[#3DD68C]">together.</span></h3>
                </div>
                
                <div className="relative z-10 space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-[#3DD68C]" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">Real-time mood monitoring and trend analysis</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-[#3DD68C]" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">Automated risk alerts for immediate intervention</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-[#3DD68C]" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">Secure, compliant communication platform</p>
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>

        <ArrowRight className="text-gray-700 shrink-0" size={32} />

        {/* Screen 2: Dashboard */}
        <div className="flex flex-col gap-6 w-[800px]">
          <div className="flex flex-col gap-2 pl-2">
            <div className="text-xs font-bold text-[#3DD68C] tracking-widest uppercase">02 · Dashboard</div>
            <div className="text-gray-400 text-sm">Patient overview at a glance</div>
          </div>
          <BrowserFrame>
            <Sidebar active="dashboard" badge={3} />
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Good morning, Dr. Rivera</h1>
                  <p className="text-sm text-gray-500">Here's what's happening with your patients today.</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 border border-gray-200 bg-white rounded-md text-gray-500 hover:text-gray-900"><Search size={16} /></button>
                </div>
              </header>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Total Patients</div>
                  <div className="text-2xl font-bold text-gray-900">12</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Active This Week</div>
                  <div className="text-2xl font-bold text-gray-900">9</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm shadow-red-50/50">
                  <div className="text-xs text-red-600 mb-1 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> Risk Alerts
                  </div>
                  <div className="text-2xl font-bold text-red-600">3</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Avg Mood Score</div>
                  <div className="text-2xl font-bold text-gray-900">5.8</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 text-sm">Priority Patients</h3>
                  <button className="text-xs text-blue-600 font-medium">View All</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {/* Critical Patient */}
                  <div className="p-3 px-5 flex items-center justify-between hover:bg-gray-50 bg-red-50/30">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium">EB</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Ethan Brooks</div>
                        <div className="text-xs text-gray-500">Requires review</div>
                      </div>
                    </div>
                    <div className="w-1/6">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold w-12">
                        2.5
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center">
                      <TrendingDown size={16} className="text-red-500" />
                    </div>
                    <div className="w-1/4 flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200">
                        CRITICAL
                      </span>
                    </div>
                  </div>
                  
                  {/* High Risk Patient */}
                  <div className="p-3 px-5 flex items-center justify-between hover:bg-gray-50 bg-orange-50/30">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium">JW</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">James Wilson</div>
                        <div className="text-xs text-gray-500">Missed session</div>
                      </div>
                    </div>
                    <div className="w-1/6">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold w-12">
                        3.2
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center">
                      <TrendingDown size={16} className="text-red-500" />
                    </div>
                    <div className="w-1/4 flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
                        HIGH
                      </span>
                    </div>
                  </div>

                  {/* Normal Patient */}
                  <div className="p-3 px-5 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium">AK</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Alex Kim</div>
                        <div className="text-xs text-gray-500">Checked in today</div>
                      </div>
                    </div>
                    <div className="w-1/6">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold w-12">
                        6.2
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center">
                      <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <div className="w-1/4 flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        LOW
                      </span>
                    </div>
                  </div>
                  
                  {/* Normal Patient */}
                  <div className="p-3 px-5 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-xs flex items-center justify-center font-medium">MC</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Maya Chen</div>
                        <div className="text-xs text-gray-500">Checked in yesterday</div>
                      </div>
                    </div>
                    <div className="w-1/6">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold w-12">
                        7.1
                      </div>
                    </div>
                    <div className="w-1/6 flex justify-center">
                      <Minus size={16} className="text-gray-400" />
                    </div>
                    <div className="w-1/4 flex justify-end">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        LOW
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>

        <ArrowRight className="text-gray-700 shrink-0" size={32} />

        {/* Screen 3: Patient List */}
        <div className="flex flex-col gap-6 w-[800px]">
          <div className="flex flex-col gap-2 pl-2">
            <div className="text-xs font-bold text-[#3DD68C] tracking-widest uppercase">03 · Patients</div>
            <div className="text-gray-400 text-sm">Full roster with risk levels</div>
          </div>
          <BrowserFrame>
            <Sidebar active="patients" badge={3} />
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Patients</h1>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="Search patients..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none w-64" />
                  </div>
                  <button className="px-4 py-2 bg-[#0a0a0a] text-white text-sm font-medium rounded-md hover:bg-black">+ Add</button>
                </div>
              </header>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                      <th className="px-4 py-3 font-medium">Patient Name</th>
                      <th className="px-4 py-3 font-medium text-center">Avg Mood (7d)</th>
                      <th className="px-4 py-3 font-medium text-center">Trend</th>
                      <th className="px-4 py-3 font-medium">Risk Level</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    
                    <tr className="bg-red-50/40 hover:bg-red-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold">EB</div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Ethan Brooks</div>
                            <div className="text-[10px] text-gray-500">ethan.b@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold w-10">2.5</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TrendingDown size={14} className="text-red-500 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">CRITICAL</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-blue-600 font-medium hover:underline">View</button>
                      </td>
                    </tr>
                    
                    <tr className="bg-orange-50/40 hover:bg-orange-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-xs flex items-center justify-center font-bold">JW</div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">James Wilson</div>
                            <div className="text-[10px] text-gray-500">james.w@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-bold w-10">3.2</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TrendingDown size={14} className="text-red-500 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">HIGH</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-blue-600 font-medium hover:underline">View</button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">AK</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Alex Kim</div>
                            <div className="text-[10px] text-gray-500">alex.k@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold w-10">6.2</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TrendingUp size={14} className="text-green-500 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">LOW</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-blue-600 font-medium hover:underline">View</button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">MC</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Maya Chen</div>
                            <div className="text-[10px] text-gray-500">maya.c@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold w-10">7.1</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Minus size={14} className="text-gray-400 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">LOW</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-blue-600 font-medium hover:underline">View</button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">SM</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Sofia Martinez</div>
                            <div className="text-[10px] text-gray-500">sofia.m@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs font-bold w-10">8.4</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <TrendingUp size={14} className="text-green-500 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">LOW</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-xs text-blue-600 font-medium hover:underline">View</button>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </BrowserFrame>
        </div>

        <ArrowRight className="text-gray-700 shrink-0" size={32} />

        {/* Screen 4: Alerts */}
        <div className="flex flex-col gap-6 w-[800px]">
          <div className="flex flex-col gap-2 pl-2">
            <div className="text-xs font-bold text-[#3DD68C] tracking-widest uppercase">04 · Risk Alerts</div>
            <div className="text-gray-400 text-sm">Automated mood-drop detection</div>
          </div>
          <BrowserFrame>
            <Sidebar active="alerts" badge={3} />
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Risk Alerts <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">3 Active</span>
                  </h1>
                </div>
                <div className="flex gap-2 text-sm">
                  <select className="border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none">
                    <option>All severities</option>
                  </select>
                </div>
              </header>

              <div className="space-y-3">
                
                {/* Critical Alert 1 */}
                <div className="bg-white border-l-4 border-l-red-500 border border-gray-200 rounded-r-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-red-500" />
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">CRITICAL</span>
                      <span className="text-sm font-semibold text-gray-900 ml-1">Ethan Brooks</span>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Mood score of 2 logged with note <span className="italic bg-gray-100 px-1 py-0.5 rounded">"Don't see the point"</span>. Requires urgent review.
                  </p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 font-medium">Dismiss</button>
                    <button className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 font-medium">Review Patient</button>
                  </div>
                </div>

                {/* Critical Alert 2 */}
                <div className="bg-white border-l-4 border-l-red-500 border border-gray-200 rounded-r-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-red-500" />
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">CRITICAL</span>
                      <span className="text-sm font-semibold text-gray-900 ml-1">James Wilson</span>
                    </div>
                    <span className="text-xs text-gray-500">Yesterday</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Sustained low mood (avg 3.1) over 7 days. Patient missed two scheduled sessions this week.
                  </p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 font-medium">Dismiss</button>
                    <button className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 font-medium">Review Patient</button>
                  </div>
                </div>

                {/* High Alert 1 */}
                <div className="bg-white border-l-4 border-l-orange-400 border border-gray-200 rounded-r-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-orange-500" />
                      <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">HIGH</span>
                      <span className="text-sm font-semibold text-gray-900 ml-1">Ethan Brooks</span>
                    </div>
                    <span className="text-xs text-gray-500">3 days ago</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Mood average remains critical at 2.6/10 over the last 13 days.
                  </p>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 font-medium">Dismiss</button>
                    <button className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 font-medium">Review Patient</button>
                  </div>
                </div>

                {/* Resolved Alert */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-75">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">RESOLVED</span>
                      <span className="text-sm font-medium text-gray-500 ml-1">James Wilson</span>
                    </div>
                    <span className="text-xs text-gray-400">4 days ago</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Mood score dropped to 2 — patient noted 'very dark day'.
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <CheckCircle2 size={12} /> Reviewed by Dr. Rivera
                  </div>
                </div>

              </div>
            </div>
          </BrowserFrame>
        </div>

        <ArrowRight className="text-gray-700 shrink-0" size={32} />

        {/* Screen 5: Client Profile */}
        <div className="flex flex-col gap-6 w-[800px] pr-16">
          <div className="flex flex-col gap-2 pl-2">
            <div className="text-xs font-bold text-[#3DD68C] tracking-widest uppercase">05 · Client Profile</div>
            <div className="text-gray-400 text-sm">Full history, notes & messaging</div>
          </div>
          <BrowserFrame>
            <Sidebar active="patients" badge={3} />
            <div className="flex-1 overflow-y-auto bg-white flex flex-col">
              
              {/* Profile Header */}
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 text-xl flex items-center justify-center font-bold shrink-0">
                      JW
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        James Wilson
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">HIGH RISK</span>
                      </h1>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>james.w@example.com</span>
                        <span>•</span>
                        <span>Last active: Yesterday</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 flex items-center gap-1">
                      <MessageSquare size={14} /> Message
                    </button>
                    <button className="px-3 py-1.5 bg-[#0a0a0a] text-white text-xs font-medium rounded hover:bg-black">
                      Schedule Session
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-2 border-b border-gray-200">
                  <div className="text-sm font-medium text-gray-900 border-b-2 border-[#0a0a0a] pb-2 px-1">Overview</div>
                  <div className="text-sm font-medium text-gray-500 pb-2 px-1">Mood</div>
                  <div className="text-sm font-medium text-gray-500 pb-2 px-1">Journal</div>
                  <div className="text-sm font-medium text-gray-500 pb-2 px-1">Tasks</div>
                  <div className="text-sm font-medium text-gray-500 pb-2 px-1">Notes</div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-3 gap-6 overflow-y-auto">
                {/* Left Column - Stats & Chart */}
                <div className="col-span-1 flex flex-col gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">7-Day Mood Avg</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-orange-600">3.2</div>
                      <div className="text-xs text-red-500 flex items-center font-medium"><TrendingDown size={12} className="mr-0.5" /> -1.4</div>
                    </div>
                    
                    {/* Mini chart */}
                    <div className="flex items-end gap-1.5 mt-4 h-16 pt-2 border-b border-gray-200">
                      <div className="w-1/7 bg-blue-400 h-[60%] rounded-t-sm w-full opacity-60"></div>
                      <div className="w-1/7 bg-blue-400 h-[50%] rounded-t-sm w-full opacity-60"></div>
                      <div className="w-1/7 bg-orange-400 h-[30%] rounded-t-sm w-full"></div>
                      <div className="w-1/7 bg-orange-400 h-[35%] rounded-t-sm w-full"></div>
                      <div className="w-1/7 bg-red-400 h-[20%] rounded-t-sm w-full"></div>
                      <div className="w-1/7 bg-red-400 h-[25%] rounded-t-sm w-full"></div>
                      <div className="w-1/7 bg-orange-400 h-[32%] rounded-t-sm w-full"></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                      <span>Mon</span>
                      <span>Sun</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold mb-3">Recent Alerts</h3>
                    <div className="space-y-3">
                      <div className="border-l-2 border-orange-500 pl-2">
                        <div className="text-xs font-medium text-gray-900">High Risk Threshold</div>
                        <div className="text-[10px] text-gray-500">Yesterday</div>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-2">
                        <div className="text-xs font-medium text-gray-500 line-through">Missed Check-in</div>
                        <div className="text-[10px] text-gray-400">4 days ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Logs & Notes */}
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="text-sm font-semibold text-gray-900">Recent Entries</h3>
                      <button className="text-xs text-blue-600 font-medium">View All</button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      <div className="p-3 px-4 flex gap-4">
                        <div className="shrink-0 flex flex-col items-center mt-1">
                          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">3</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-900">Mood Check-in</span>
                            <span className="text-[10px] text-gray-500">Yesterday, 8:45 PM</span>
                          </div>
                          <p className="text-xs text-gray-600">"Feeling overwhelmed and exhausted. Didn't sleep much again."</p>
                        </div>
                      </div>
                      
                      <div className="p-3 px-4 flex gap-4">
                        <div className="shrink-0 flex flex-col items-center mt-1">
                          <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">2</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-900">Mood Check-in</span>
                            <span className="text-[10px] text-gray-500">Friday, 10:12 AM</span>
                          </div>
                          <p className="text-xs text-gray-600 italic text-gray-400">No note provided.</p>
                        </div>
                      </div>

                      <div className="p-3 px-4 flex gap-4">
                        <div className="shrink-0 flex flex-col items-center mt-1">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                            <FileText size={12} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-900">Journal Entry</span>
                            <span className="text-[10px] text-gray-500">Wednesday, 9:00 PM</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1">"Work was really difficult today. I tried using the breathing exercises but..."</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50/50 rounded-lg border border-yellow-100 p-4 relative h-full">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex justify-between">
                      Private Notes
                      <button className="text-xs text-blue-600 font-medium">Edit</button>
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed font-serif">
                      Patient is experiencing a significant depressive episode. Sleep patterns remain disrupted. We discussed adjusting the CBT exercises to focus on smaller, more manageable daily tasks. Will monitor closely this week given the downward mood trend.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </BrowserFrame>
        </div>

      </div>
    </div>
  );
}
