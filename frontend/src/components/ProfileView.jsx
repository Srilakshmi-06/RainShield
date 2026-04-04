import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Briefcase, 
  Settings, ShieldCheck, CreditCard, ChevronRight,
  TrendingUp, Award, Clock
} from 'lucide-react';

const ProfileView = ({ user }) => {
  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="profile-container"
    >
      {/* Profile Header Card */}
      <div className="main-card glass-panel profile-header-card mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="profile-avatar-large">
            {user.name?.charAt(0) || 'U'}
            <div className="status-indicator-online"></div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-black mb-2">{user.name}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <span className="badge-tier premium px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 bg-white/5">
                 {user.tier || 'Standard'} Member
               </span>
               <span className="badge-platform px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-primary">
                 {user.platform || 'Partner'}
               </span>
               <span className="badge-status verified px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                 Verified Worker
               </span>
            </div>
          </div>

          <button className="btn btn-primary px-8 py-3 rounded-xl flex items-center gap-2">
            <Settings size={18}/> Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Details */}
        <div className="lg:col-span-2">
          <div className="main-card glass-panel h-full">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
               <User className="text-primary" size={20}/> Identity & Contact
            </h3>
            
            <div className="space-y-6">
               <div className="profile-info-row flex justify-between items-center py-4 border-b border-white/5">
                  <div className="label-side flex items-center gap-4">
                     <div className="p-2.5 bg-white/5 rounded-lg text-muted"><Phone size={18}/></div>
                     <span className="text-sm font-semibold">Mobile Number</span>
                  </div>
                  <span className="text-sm font-bold">{user.phone}</span>
               </div>

               <div className="profile-info-row flex justify-between items-center py-4 border-b border-white/5">
                  <div className="label-side flex items-center gap-4">
                     <div className="p-2.5 bg-white/5 rounded-lg text-muted"><MapPin size={18}/></div>
                     <span className="text-sm font-semibold">Registered City</span>
                  </div>
                  <span className="text-sm font-bold">{user.city || 'Mumbai'}</span>
               </div>

               <div className="profile-info-row flex justify-between items-center py-4 border-b border-white/5">
                  <div className="label-side flex items-center gap-4">
                     <div className="p-2.5 bg-white/5 rounded-lg text-muted"><Briefcase size={18}/></div>
                     <span className="text-sm font-semibold">Partner App</span>
                  </div>
                  <span className="text-sm font-bold">{user.platform || 'Independent'}</span>
               </div>

               <div className="profile-info-row flex justify-between items-center py-4">
                  <div className="label-side flex items-center gap-4">
                     <div className="p-2.5 bg-white/5 rounded-lg text-muted"><ShieldCheck size={18}/></div>
                     <span className="text-sm font-semibold">KYC Verification</span>
                  </div>
                  <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-md">Completed</span>
               </div>
            </div>
          </div>
        </div>

        {/* Work Stats & Risk */}
        <div className="flex flex-col gap-6">
           <div className="main-card glass-panel risk-stat-card">
              <h3 className="text-sm text-muted uppercase tracking-widest font-black mb-4">Risk Profile</h3>
              <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-black">{user.riskScore || 20}%</span>
                  <TrendingUp className="text-emerald-400 mb-1" size={20} />
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                  Calculated based on your {user.workingHours || 8}-hour daily shifts and environmental exposure.
              </p>
           </div>

           <div className="main-card glass-panel achievements-card">
              <h3 className="text-sm text-muted uppercase tracking-widest font-black mb-6">Achievements</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-full"><Award size={16}/></div>
                    <span className="text-xs font-bold">Rain Warrior (Lvl 3)</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-full"><Clock size={16}/></div>
                    <span className="text-xs font-bold">99.9% Protection Uptime</span>
                 </div>
              </div>
           </div>

           <button className="main-card glass-panel hover:bg-white/5 transition-all text-left flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/5 rounded-lg text-primary"><CreditCard size={18}/></div>
                <span className="text-sm font-bold">Payout Settings</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileView;
