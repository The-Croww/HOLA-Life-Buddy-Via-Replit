import React from "react";
import { 
  ArrowRight, 
  Leaf, 
  MessageCircle, 
  Wind, 
  Book, 
  Check, 
  Bell, 
  Lock, 
  HeartHandshake, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  User as UserIcon,
  Smile,
  Meh,
  Frown,
  Activity,
  Calendar
} from "lucide-react";

const COLORS = {
  bg: "#0a0a0a",
  frameBg: "#0f0f0f",
  accent: "#3DD68C",
  card: "#1a1a1a",
  textMain: "#ffffff",
  textMuted: "#a1a1aa",
  border: "#27272a",
};

export function UserFlow() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-12 font-sans overflow-x-auto">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">HOLA! Life Buddy</h1>
        <p className="text-[#a1a1aa] font-medium tracking-wide text-sm uppercase">User App Walkthrough</p>
      </div>

      {/* Frames Row */}
      <div className="flex items-start justify-center gap-6 min-w-max pb-12">
        <FrameWrapper step="01 · Welcome" caption="3-slide carousel introduces the app">
          <ScreenOnboarding />
        </FrameWrapper>
        
        <Arrow />

        <FrameWrapper step="02 · Home" caption="Daily check-in & affirmation">
          <ScreenHome />
        </FrameWrapper>

        <Arrow />

        <FrameWrapper step="03 · Mood Tracker" caption="1–10 scale + emotion tags">
          <ScreenMood />
        </FrameWrapper>

        <Arrow />

        <FrameWrapper step="04 · Weekly Trends" caption="Bar chart + recent entries">
          <ScreenHistory />
        </FrameWrapper>

        <Arrow />

        <FrameWrapper step="05 · Profile" caption="Settings & account">
          <ScreenProfile />
        </FrameWrapper>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex flex-col h-[600px] justify-center text-[#27272a]">
      <ArrowRight strokeWidth={1.5} size={32} />
    </div>
  );
}

function FrameWrapper({ children, step, caption }: { children: React.ReactNode; step: string; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Top Label */}
      <div className="bg-[#1a1a1a] text-[#3DD68C] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-sm border border-[#27272a]">
        {step}
      </div>

      {/* Phone Frame (390 x 720 aspect ratio, scaled to ~320x590 for layout) */}
      <div className="w-[320px] h-[590px] bg-[#0f0f0f] rounded-[40px] border-[8px] border-[#27272a] shadow-2xl overflow-hidden relative shadow-black/50 ring-1 ring-white/5">
        {/* Notch simulate */}
        <div className="absolute top-0 inset-x-0 h-6 bg-[#27272a] rounded-b-2xl w-32 mx-auto z-50"></div>
        
        <div className="w-full h-full pt-10 pb-6 px-5 overflow-y-auto flex flex-col hide-scrollbar">
          {children}
        </div>
      </div>

      {/* Bottom Caption */}
      <div className="text-center max-w-[280px]">
        <p className="text-sm text-[#a1a1aa] leading-snug">{caption}</p>
      </div>
    </div>
  );
}

/* --- SCREENS --- */

function ScreenOnboarding() {
  return (
    <div className="flex flex-col h-full items-center justify-between mt-12">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-8 border border-[#27272a]">
          <Leaf className="text-[#3DD68C]" size={40} strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4 leading-tight">Your mental wellness companion</h2>
        <p className="text-[#a1a1aa] text-[15px] leading-relaxed px-4">Track your mood. Build resilience. Feel better.</p>
      </div>

      <div className="w-full flex flex-col gap-4 mt-auto pb-4">
        <div className="flex justify-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-[#3DD68C]"></div>
          <div className="w-2 h-2 rounded-full bg-[#27272a]"></div>
          <div className="w-2 h-2 rounded-full bg-[#27272a]"></div>
        </div>
        <button className="w-full bg-[#3DD68C] text-[#0a0a0a] font-semibold py-3.5 rounded-xl hover:bg-[#34b878] transition-colors">
          Get Started
        </button>
        <button className="w-full bg-[#1a1a1a] text-white font-semibold py-3.5 rounded-xl border border-[#27272a]">
          Sign In
        </button>
      </div>
    </div>
  );
}

function ScreenHome() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-sm text-[#a1a1aa] mb-1">Good morning,</p>
          <h2 className="text-xl font-semibold">Alex ☀️</h2>
        </div>
        <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#27272a]">
          <UserIcon size={18} className="text-[#3DD68C]" />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-[#a1a1aa] mb-4">How are you today?</h3>
        <div className="flex justify-between">
          {["😔", "😕", "😐", "🙂", "😄"].map((emoji, i) => (
            <button key={i} className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#27272a] flex items-center justify-center text-xl hover:border-[#3DD68C] hover:bg-[#3DD68C]/10 transition-all">
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#27272a] rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Leaf size={16} className="text-[#3DD68C]" />
          <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Daily Affirmation</h3>
        </div>
        <p className="text-lg font-medium leading-snug italic text-white/90">"You are stronger than you think."</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto">
        <HomeTile icon={<Book size={20} />} label="Journal" color="text-blue-400" />
        <HomeTile icon={<Wind size={20} />} label="Breathe" color="text-teal-400" />
        <HomeTile icon={<MessageCircle size={20} />} label="Chat" color="text-purple-400" />
        <HomeTile icon={<Activity size={20} />} label="Meditate" color="text-amber-400" />
      </div>
    </div>
  );
}

function HomeTile({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#27272a] rounded-2xl p-4 flex flex-col gap-3">
      <div className={\`\${color}\`}>{icon}</div>
      <span className="text-sm font-medium text-white/80">{label}</span>
    </div>
  );
}

function ScreenMood() {
  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-10">
        <h2 className="text-xl font-semibold mb-2">How are you feeling?</h2>
        <p className="text-sm text-[#a1a1aa]">Slide to set your mood score</p>
      </div>

      <div className="flex flex-col items-center justify-center mb-10">
        {/* Fake Slider / Dial */}
        <div className="w-48 h-48 rounded-full border-4 border-[#1a1a1a] flex items-center justify-center relative shadow-[0_0_40px_rgba(61,214,140,0.1)]">
          <div className="absolute inset-0 rounded-full border-4 border-[#3DD68C] border-t-transparent border-l-transparent rotate-45"></div>
          <div className="absolute bottom-2 left-6 w-4 h-4 rounded-full bg-[#3DD68C] shadow-[0_0_10px_rgba(61,214,140,0.5)]"></div>
          
          <div className="flex flex-col items-center text-center">
            <span className="text-6xl font-bold text-[#3DD68C] tracking-tighter">7</span>
            <span className="text-sm font-medium text-white/80 mt-1">Good</span>
          </div>
        </div>
      </div>

      <div className="mb-auto">
        <h3 className="text-sm font-medium text-[#a1a1aa] mb-4">What's making you feel this way?</h3>
        <div className="flex flex-wrap gap-2">
          <Tag label="Calm" selected />
          <Tag label="Hopeful" selected />
          <Tag label="Tired" />
          <Tag label="Anxious" />
          <Tag label="Happy" />
          <Tag label="Grateful" />
        </div>
      </div>

      <div className="mt-6">
        <input 
          type="text" 
          placeholder="Add a note (optional)..." 
          className="w-full bg-[#1a1a1a] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#52525b] mb-4 focus:outline-none"
          readOnly
        />
        <button className="w-full bg-[#3DD68C] text-[#0a0a0a] font-semibold py-3.5 rounded-xl">
          Save Entry
        </button>
      </div>
    </div>
  );
}

function Tag({ label, selected }: { label: string, selected?: boolean }) {
  if (selected) {
    return (
      <div className="bg-[#3DD68C]/10 border border-[#3DD68C] text-[#3DD68C] px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
        <span>{label}</span>
        <Check size={14} strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="bg-[#1a1a1a] border border-[#27272a] text-[#a1a1aa] px-3 py-1.5 rounded-full text-sm font-medium">
      {label}
    </div>
  );
}

function ScreenHistory() {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-6">Your week</h2>
      
      {/* Chart */}
      <div className="bg-[#1a1a1a] border border-[#27272a] rounded-2xl p-5 mb-8 h-48 flex items-end justify-between gap-2 relative">
        <div className="absolute top-4 left-5 right-5 border-t border-dashed border-[#27272a]"></div>
        <div className="absolute top-1/2 left-5 right-5 border-t border-dashed border-[#27272a]"></div>
        
        {/* Bars */}
        <Bar day="M" height="50%" val="5" />
        <Bar day="T" height="40%" val="4" />
        <Bar day="W" height="60%" val="6" />
        <Bar day="T" height="80%" val="8" color="#3DD68C" />
        <Bar day="F" height="40%" val="4" />
        <Bar day="S" height="70%" val="7" />
        <Bar day="S" height="10%" val="-" empty />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Recent entries</h3>
        <span className="text-xs text-[#a1a1aa]">See all</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto hide-scrollbar">
        <HistoryRow date="Today, 8:30 AM" score={7} tag="Calm, Hopeful" />
        <HistoryRow date="Yesterday, 9:15 PM" score={6} tag="Grateful" color="text-blue-400" bg="bg-blue-400/10" border="border-blue-400/20" />
        <HistoryRow date="Tue, 10:00 AM" score={4} tag="Anxious" color="text-amber-400" bg="bg-amber-400/10" border="border-amber-400/20" />
      </div>
    </div>
  );
}

function Bar({ day, height, val, empty, color }: { day: string, height: string, val: string, empty?: boolean, color?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 z-10 w-full">
      <div className="w-full bg-[#27272a] rounded-t-sm rounded-b-sm h-32 flex flex-col justify-end overflow-hidden relative">
        {!empty && (
          <div 
            className="w-full rounded-sm transition-all" 
            style={{ height, background: color || "linear-gradient(to top, #14532d, #3DD68C)", opacity: color ? 1 : 0.7 }}
          ></div>
        )}
      </div>
      <span className="text-[10px] text-[#a1a1aa] font-medium">{day}</span>
    </div>
  );
}

function HistoryRow({ date, score, tag, color = "text-[#3DD68C]", bg = "bg-[#3DD68C]/10", border = "border-[#3DD68C]/20" }: { date: string, score: number, tag: string, color?: string, bg?: string, border?: string }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-[#a1a1aa] mb-1">{date}</p>
        <p className="text-sm font-medium text-white/90">{tag}</p>
      </div>
      <div className={\`w-8 h-8 rounded-full \${bg} \${border} border flex items-center justify-center\`}>
        <span className={\`text-sm font-bold \${color}\`}>{score}</span>
      </div>
    </div>
  );
}

function ScreenProfile() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center mt-6 mb-10">
        <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#3DD68C] flex items-center justify-center mb-4 relative">
          <span className="text-3xl font-semibold text-white">A</span>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#27272a] rounded-full border-2 border-[#0f0f0f] flex items-center justify-center">
            <UserIcon size={12} className="text-[#a1a1aa]" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Alex Kim</h2>
        <p className="text-sm text-[#a1a1aa] mt-1">alex@example.com</p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#27272a] rounded-2xl overflow-hidden mb-6">
        <SettingsRow icon={<Bell size={18} />} label="Notifications" />
        <SettingsRow icon={<Lock size={18} />} label="Privacy" />
        <SettingsRow icon={<HeartHandshake size={18} />} label="Linked Clinician" value="Dr. Rivera" />
        <SettingsRow icon={<HelpCircle size={18} />} label="Help & Support" border={false} />
      </div>

      <div className="bg-[#1a1a1a] border border-[#27272a] rounded-2xl overflow-hidden mt-auto">
        <button className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-red-400/5 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, value, border = true }: { icon: React.ReactNode, label: string, value?: string, border?: boolean }) {
  return (
    <div className={\`flex items-center justify-between p-4 \${border ? 'border-b border-[#27272a]' : ''}\`}>
      <div className="flex items-center gap-3 text-white/80">
        <div className="text-[#a1a1aa]">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-[#a1a1aa]">{value}</span>}
        <ChevronRight size={16} className="text-[#52525b]" />
      </div>
    </div>
  );
}
