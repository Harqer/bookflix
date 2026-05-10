import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Switch, Dimensions } from 'react-native';
import { LogOut, ChevronRight, CreditCard, Users, Bell, Moon, Shield, Cloud, Video, Sparkles } from 'lucide-react-native';
import { useUser, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';

// 🏛️ FLIXSTUDIO COMMAND CONSTANTS
const FS_BACKGROUND = '#0B0C10';
const FS_ACCENT = '#E50914';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const books = useQuery(api.studio.listBooks) || [];

  // 🛠️ FUNCTIONAL STATE
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleManagePlan = () => {
    // Redirect to Clerk user profile for billing management
    router.push('https://accounts.clerk.com/user');
  };

  return (
    <View style={{ backgroundColor: FS_BACKGROUND }} className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* 🎬 PROFILE HEADER SECTION */}
        <View className="pt-24 pb-10 items-center">
          <View className="relative">
            <View style={{ borderColor: FS_ACCENT }} className="w-28 h-28 rounded-full border-4 p-1 shadow-2xl">
              <View className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
                <Image 
                  source={{ uri: user?.imageUrl }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            </View>
            <View style={{ backgroundColor: FS_ACCENT }} className="absolute -bottom-1 -right-1 px-3 py-1 rounded-full shadow-lg">
              <Text className="text-white text-[8px] font-black uppercase tracking-widest">PRO</Text>
            </View>
          </View>

          <View className="mt-6 items-center">
            <Text className="text-white text-3xl font-black uppercase tracking-tighter font-['Space_Grotesk']">
              {user?.fullName || 'Julian Vane'}
            </Text>
            <Text className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Executive Producer & Director</Text>
          </View>

          <View className="flex-row gap-10 mt-10">
            <View className="items-center">
              <Text style={{ color: FS_ACCENT }} className="text-2xl font-black">{books.length}</Text>
              <Text className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Projects</Text>
            </View>
            <View className="w-px h-8 bg-white/10 my-auto" />
            <View className="items-center">
              <Text style={{ color: FS_ACCENT }} className="text-2xl font-black">42.8k</Text>
              <Text className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Views</Text>
            </View>
            <View className="w-px h-8 bg-white/10 my-auto" />
            <View className="items-center">
              <Text style={{ color: FS_ACCENT }} className="text-2xl font-black">12</Text>
              <Text className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Awards</Text>
            </View>
          </View>
        </View>

        <View className="px-8 space-y-10 pb-40">
          
          {/* 💎 SUBSCRIPTION COMMAND CARD */}
          <TouchableOpacity 
            onPress={handleManagePlan}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl"
          >
            <LinearGradient colors={['rgba(229, 9, 20, 0.1)', 'transparent']} className="absolute inset-0" />
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text style={{ color: FS_ACCENT }} className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">Active Plan</Text>
                <Text className="text-white text-2xl font-black uppercase tracking-tighter">Cinematic Pro</Text>
              </View>
              <Sparkles color={FS_ACCENT} size={32} />
            </View>
            <Text className="text-zinc-500 text-xs font-medium leading-relaxed mb-6">
              Access to 8K exporting, Dolby Atmos mastering, and unlimited collaborative studio seats.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={handleManagePlan} style={{ backgroundColor: FS_ACCENT }} className="px-6 py-2.5 rounded-xl">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">Manage Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white/10 px-6 py-2.5 rounded-xl border border-white/5">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">Upgrade</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* 🛠️ PRODUCTION GROUP */}
          <View>
            <Text className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-1">Production Protocol</Text>
            <View className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              <TouchableOpacity className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <Video color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Default Export Resolution</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-zinc-500 text-[10px] font-black">4K UHD</Text>
                  <ChevronRight color="white" size={16} opacity={0.3} />
                </View>
              </TouchableOpacity>

              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <Cloud color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Auto-Sync Workspace</Text>
                </View>
                <Switch 
                  value={autoSync} 
                  onValueChange={setAutoSync}
                  trackColor={{ false: '#333', true: FS_ACCENT }}
                  thumbColor="white"
                />
              </View>
            </View>
          </View>

          {/* 💳 ACCOUNT GROUP */}
          <View>
            <Text className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-1">Studio Account</Text>
            <View className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              <TouchableOpacity className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <Shield color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Security & Privacy</Text>
                </View>
                <ChevronRight color="white" size={16} opacity={0.3} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleManagePlan} className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <CreditCard color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Billing Details</Text>
                </View>
                <ChevronRight color="white" size={16} opacity={0.3} />
              </TouchableOpacity>

              <TouchableOpacity className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <Users color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Studio Members</Text>
                </View>
                <View className="flex-row -space-x-3">
                  <View className="w-7 h-7 rounded-full bg-zinc-700 border-2 border-[#0B0C10]" />
                  <View className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-[#0B0C10]" />
                  <View className="w-7 h-7 rounded-full bg-white/10 border-2 border-[#0B0C10] items-center justify-center">
                    <Text className="text-white/40 text-[8px] font-black">+3</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 📱 APP GROUP */}
          <View>
            <Text className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mb-4 px-1">App Configuration</Text>
            <View className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <Bell color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Directorial Notifications</Text>
                </View>
                <Switch 
                  value={notifications} 
                  onValueChange={setNotifications}
                  trackColor={{ false: '#333', true: FS_ACCENT }}
                  thumbColor="white"
                />
              </View>

              <TouchableOpacity className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4">
                  <View className="bg-white/5 p-2 rounded-xl">
                    <Moon color="white" size={20} opacity={0.6} />
                  </View>
                  <Text className="text-white font-black uppercase text-xs tracking-tight">Interface Theme</Text>
                </View>
                <Text style={{ color: FS_ACCENT }} className="text-[10px] font-black uppercase tracking-widest">Dark Cinema</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSignOut} className="flex-row items-center p-5">
                <View className="bg-red-500/10 p-2 rounded-xl mr-4">
                  <LogOut color={FS_ACCENT} size={20} />
                </View>
                <Text style={{ color: FS_ACCENT }} className="font-black uppercase text-xs tracking-widest">Log Out {user?.firstName || 'Director'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center py-10">
            <Text className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">FLIXSTUDIO VERSION 4.2.1-CINEMA</Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
