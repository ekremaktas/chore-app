import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ChoreCard from "@/components/chores/chore-card";
import RewardCard from "@/components/rewards/reward-card";
import AchievementBadge from "@/components/achievements/achievement-badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Queries
  const { data: chores, isLoading: isLoadingChores } = useQuery({
    queryKey: ['/api/chores'],
    enabled: !!user,
  });

  const { data: rewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ['/api/rewards'],
    enabled: !!user,
  });

  const { data: achievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ['/api/users', user?.id, 'achievements'],
    enabled: !!user,
  });

  // Just return null if not mounted or user is not authenticated
  // Authentication and redirection is handled in App.tsx
  if (!mounted || !user) return null;

  // Filter today's chores
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayChores = chores?.filter(chore => {
    const choreDate = new Date(chore.dueDate);
    choreDate.setHours(0, 0, 0, 0);
    return choreDate.getTime() === today.getTime();
  }) || [];

  const completedTodayCount = todayChores.filter(chore => chore.isCompleted).length;
  const totalTodayCount = todayChores.length;

  // Available rewards (top 3)
  const availableRewards = rewards?.slice(0, 3) || [];

  // Recent achievements (top 3)
  const recentAchievements = achievements?.slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome & Progress Section */}
            <div className="mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                  <div>
                    <h2 className="font-heading text-2xl lg:text-3xl text-gray-800">Hey {user.displayName.split(' ')[0]}! 👋</h2>
                    <p className="text-gray-600">You're doing great today!</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-accent/10 text-accent-dark p-3 rounded-lg">
                    <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center">
                      <i className="ri-level-up-line text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm">Level {user.level}</p>
                      <div className="w-36 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-accent rounded-full h-2" 
                          style={{ width: `${(user.points % 100) || 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <div className="bg-primary/10 rounded-lg p-3 text-center">
                    <div className="text-primary font-bold text-xl">{totalTodayCount}</div>
                    <div className="text-sm text-gray-600">Chores Today</div>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3 text-center">
                    <div className="text-success font-bold text-xl">{completedTodayCount}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-3 text-center">
                    <div className="text-accent-dark font-bold text-xl">{user.points}</div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                  <div className="bg-secondary/10 rounded-lg p-3 text-center">
                    <div className="text-secondary font-bold text-xl">{recentAchievements.length}</div>
                    <div className="text-sm text-gray-600">Badges</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Today's Chores Section */}
            <section className="mb-8">
              <h3 className="font-heading text-xl mb-4 text-gray-800">Today's Chores</h3>
              
              {isLoadingChores ? (
                <div className="text-center py-8">Loading chores...</div>
              ) : todayChores.length > 0 ? (
                todayChores.map(chore => (
                  <ChoreCard key={chore.id} chore={chore} />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <i className="ri-calendar-check-line text-4xl text-gray-400 mb-2"></i>
                  <h4 className="text-lg font-bold mb-2">No chores for today!</h4>
                  <p className="text-gray-600">Enjoy your free time or check out other days.</p>
                  <Link href="/chores">
                    <Button className="mt-4 bg-primary text-white">View All Chores</Button>
                  </Link>
                </div>
              )}
            </section>
            
            {/* Rewards Section */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-heading text-xl text-gray-800">Rewards Available</h3>
                <Link href="/rewards">
                  <a className="text-primary font-bold text-sm">View All</a>
                </Link>
              </div>
              
              {isLoadingRewards ? (
                <div className="text-center py-8">Loading rewards...</div>
              ) : availableRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableRewards.map(reward => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <i className="ri-gift-line text-4xl text-gray-400 mb-2"></i>
                  <h4 className="text-lg font-bold mb-2">No rewards available yet</h4>
                  <p className="text-gray-600">Ask your parents to add some awesome rewards!</p>
                </div>
              )}
            </section>
            
            {/* Recent Achievements */}
            <section className="mb-8">
              <h3 className="font-heading text-xl mb-4 text-gray-800">Recent Achievements</h3>
              
              {isLoadingAchievements ? (
                <div className="text-center py-8">Loading achievements...</div>
              ) : recentAchievements.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex flex-wrap gap-4">
                    {recentAchievements.map(achievement => (
                      <AchievementBadge key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <i className="ri-medal-line text-4xl text-gray-400 mb-2"></i>
                  <h4 className="text-lg font-bold mb-2">No achievements yet</h4>
                  <p className="text-gray-600">Complete chores to earn awesome badges!</p>
                </div>
              )}
            </section>
            
            {/* API Documentation (Parent View) */}
            {user.roleType === "parent" && (
              <section className="mb-8 hidden lg:block">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-heading text-xl mb-4 text-gray-800">API Integration</h3>
                  <p className="text-gray-600 mb-4">Connect ChoreQuest with your smart home devices and other applications.</p>
                  
                  <Link href="/api">
                    <Button className="bg-primary text-white">View API Documentation</Button>
                  </Link>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
