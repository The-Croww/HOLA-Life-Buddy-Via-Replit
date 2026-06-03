import React from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bell,
  BarChart2,
  Settings,
  Search,
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";

export function Dashboard() {
  return (
    <div
      className="min-h-screen w-full bg-[#050505] text-[#e0e0e0] font-sans selection:bg-indigo-500/30 flex"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1a1a1a] flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12 text-white">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-sm tracking-tighter">
            H!
          </div>
          <span className="font-medium tracking-tight">HOLA! Life Buddy</span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
          <NavItem icon={<Users size={16} />} label="Patients" />
          <NavItem icon={<MessageSquare size={16} />} label="Messages" badge="2" />
          <NavItem icon={<Bell size={16} />} label="Alerts" badge="3" activeBadge />
          <NavItem icon={<BarChart2 size={16} />} label="Reports" />
          <NavItem icon={<Settings size={16} />} label="Settings" />
        </nav>

        <div className="mt-auto pt-6 border-t border-[#1a1a1a] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden border border-[#2a2a2a]">
            <img src="https://i.pravatar.cc/150?u=dr_sarah" alt="Dr. Sarah" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-white font-medium">Dr. Sarah Chen</span>
            <span className="text-xs text-[#808080]">Clinician</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-medium text-white tracking-tight mb-1">Morning, Dr. Chen</h1>
            <p className="text-sm text-[#808080]">Here's what's happening with your patients today.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#505050]" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-[#505050] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all w-64"
            />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <StatCard title="Total Patients" value="24" trend="+2 this month" />
          <StatCard title="Active This Week" value="18" trend="75% engagement" />
          <StatCard title="Mood Alerts" value="3" trend="Needs attention" alert />
          <StatCard title="Avg Mood Score" value="6.4/10" trend="Stable vs last week" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Entries */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-white tracking-tight">Recent Mood Entries</h2>
                <button className="text-xs text-[#808080] hover:text-white transition-colors flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#808080] border-b border-[#1a1a1a] bg-[#050505]/50">
                    <tr>
                      <th className="px-4 py-3 font-normal">Patient</th>
                      <th className="px-4 py-3 font-normal">Score</th>
                      <th className="px-4 py-3 font-normal">Tags</th>
                      <th className="px-4 py-3 font-normal text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    <TableRow name="Marcus Vance" score={3} tags={["Anxious", "Tired"]} time="10m ago" />
                    <TableRow name="Elena Rodriguez" score={8} tags={["Hopeful", "Calm"]} time="1h ago" />
                    <TableRow name="David Kim" score={5} tags={["Numb"]} time="2h ago" />
                    <TableRow name="Sophia Patel" score={4} tags={["Stressed", "Overwhelmed"]} time="4h ago" />
                    <TableRow name="James Wilson" score={7} tags={["Grateful"]} time="5h ago" />
                    <TableRow name="Olivia Martinez" score={6} tags={["Okay"]} time="Yesterday" />
                  </tbody>
                </table>
              </div>
            </section>
            
            {/* Trend Chart Mockup */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-white tracking-tight">Population Mood Trend</h2>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-[#1a1a1a] rounded-md text-white cursor-pointer">7D</span>
                  <span className="text-xs px-2 py-1 text-[#808080] hover:text-white cursor-pointer transition-colors">30D</span>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 h-64 flex flex-col justify-end relative">
                {/* Y-axis labels */}
                <div className="absolute left-6 top-6 bottom-8 flex flex-col justify-between text-xs text-[#505050]">
                  <span>10</span>
                  <span>5</span>
                  <span>0</span>
                </div>
                {/* Horizontal lines */}
                <div className="absolute left-12 right-6 top-8 bottom-8 flex flex-col justify-between pointer-events-none">
                  <div className="w-full border-t border-[#1a1a1a]/50"></div>
                  <div className="w-full border-t border-[#1a1a1a]/50"></div>
                  <div className="w-full border-t border-[#1a1a1a]/50"></div>
                </div>
                {/* Bars */}
                <div className="ml-8 flex items-end justify-between h-full pt-4 gap-2">
                  {[6, 5, 7, 6, 8, 4, 6].map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                      <div className="w-full bg-[#1a1a1a] group-hover:bg-[#2a2a2a] rounded-t-sm transition-colors relative" style={{ height: `${h * 10}%` }}>
                        {h <= 4 && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500/80"></div>}
                        <div className="absolute opacity-0 group-hover:opacity-100 -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-medium px-2 py-1 rounded transition-opacity pointer-events-none">
                          {h}.0
                        </div>
                      </div>
                      <span className="text-[10px] text-[#505050]">{'SMTWTFS'[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Alerts Panel */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-medium text-white tracking-tight flex items-center gap-2">
                  <AlertCircle size={14} className="text-indigo-400" />
                  Active Alerts
                </h2>
              </div>
              <div className="space-y-3">
                <AlertCard 
                  name="Marcus Vance" 
                  reason="Consecutive low mood scores (3 days)"
                  severity="high"
                  time="10m ago"
                />
                <AlertCard 
                  name="Sophia Patel" 
                  reason="Flagged text in journal entry"
                  severity="medium"
                  time="4h ago"
                />
                <AlertCard 
                  name="David Kim" 
                  reason="Missed check-in (48h)"
                  severity="low"
                  time="1d ago"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, badge, active, activeBadge }: { icon: React.ReactNode; label: string; badge?: string; active?: boolean; activeBadge?: boolean }) {
  return (
    <a
      href="#"
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-[#1a1a1a] text-white font-medium" : "text-[#808080] hover:bg-[#111] hover:text-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-indigo-400" : ""}>{icon}</span>
        {label}
      </div>
      {badge && (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            activeBadge ? "bg-indigo-500/20 text-indigo-300" : "bg-[#2a2a2a] text-[#a0a0a0]"
          }`}
        >
          {badge}
        </span>
      )}
    </a>
  );
}

function StatCard({ title, value, trend, alert }: { title: string; value: string; trend: string; alert?: boolean }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 flex flex-col">
      <span className="text-xs text-[#808080] font-medium tracking-tight mb-2">{title}</span>
      <span className="text-2xl font-light text-white tracking-tight mb-1">{value}</span>
      <span className={`text-[11px] ${alert ? "text-red-400/80" : "text-[#505050]"}`}>{trend}</span>
    </div>
  );
}

function TableRow({ name, score, tags, time }: { name: string; score: number; tags: string[]; time: string }) {
  const isLow = score <= 4;
  return (
    <tr className="hover:bg-[#111] transition-colors group cursor-pointer">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[10px] font-medium text-[#a0a0a0]">
            {name.charAt(0)}
          </div>
          <span className="font-medium text-white">{name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
          isLow ? "bg-red-500/10 text-red-400" : score >= 7 ? "bg-green-500/10 text-green-400" : "bg-[#1a1a1a] text-[#a0a0a0]"
        }`}>
          {score}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-[#1a1a1a] text-[#808080] text-[10px]">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right text-xs text-[#505050]">
        {time}
      </td>
    </tr>
  );
}

function AlertCard({ name, reason, severity, time }: { name: string; reason: string; severity: "high" | "medium" | "low"; time: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#2a2a2a] transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">{name}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${
            severity === 'high' ? 'bg-red-500' : severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
          }`}></span>
        </div>
        <span className="text-[10px] text-[#505050]">{time}</span>
      </div>
      <p className="text-xs text-[#808080] leading-relaxed mb-3">{reason}</p>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-1.5 text-[11px] font-medium text-[#808080] hover:text-white transition-colors">Dismiss</button>
        <button className="px-3 py-1.5 text-[11px] font-medium bg-[#1a1a1a] text-white rounded hover:bg-[#2a2a2a] transition-colors">Review</button>
      </div>
    </div>
  );
}
