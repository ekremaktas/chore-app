import { useState } from "react";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import RewardCard from "@/components/rewards/reward-card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertRewardSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";

const rewardIcons = [
  { value: "ri-movie-line", label: "Movie" },
  { value: "ri-gamepad-line", label: "Game" },
  { value: "ri-cake-line", label: "Dessert" },
  { value: "ri-shopping-bag-line", label: "Shopping" },
  { value: "ri-smartphone-line", label: "Screen Time" },
  { value: "ri-book-read-line", label: "Book" },
  { value: "ri-football-line", label: "Sports" },
  { value: "ri-money-dollar-circle-line", label: "Money" },
  { value: "ri-car-line", label: "Trip" },
  { value: "ri-gift-line", label: "Gift" },
];

export default function Rewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addRewardOpen, setAddRewardOpen] = useState(false);
  
  const { data: rewards, isLoading } = useQuery({
    queryKey: ['/api/rewards'],
    enabled: !!user,
  });

  const formSchema = insertRewardSchema.omit({ familyId: true });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsCost: 100,
      icon: "ri-gift-line",
    },
  });

  const createReward = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const rewardData = {
        ...data,
        familyId: user?.familyId || 0,
      };
      
      const res = await apiRequest("POST", "/api/rewards", rewardData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward created",
        description: "The reward has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      setAddRewardOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create reward. Please try again.",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    createReward.mutate(data);
  }

  if (!user) return null;

  const isParent = user.roleType === "parent";
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        <Sidebar />
        
        <main className="flex-grow p-4 lg:p-8 overflow-y-auto pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="font-heading text-2xl lg:text-3xl text-gray-800">Rewards Shop</h1>
                <p className="text-gray-600">You have <span className="font-bold text-accent-dark">{user.points} points</span> to spend</p>
              </div>
              {isParent && (
                <Button 
                  onClick={() => setAddRewardOpen(true)}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <i className="ri-add-line mr-1"></i> Add Reward
                </Button>
              )}
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">Loading rewards...</div>
            ) : rewards && rewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map(reward => (
                  <RewardCard key={reward.id} reward={reward} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="ri-shopping-basket-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-bold mb-2">No rewards available yet</h3>
                <p className="text-gray-600 mb-4">
                  {isParent 
                    ? "Create some rewards for your children to redeem with their points!" 
                    : "Ask your parents to add some awesome rewards you can earn!"}
                </p>
                {isParent && (
                  <Button 
                    onClick={() => setAddRewardOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    Add First Reward
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      
      <Dialog open={addRewardOpen} onOpenChange={setAddRewardOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Add New Reward</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Movie Night" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add details about the reward" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pointsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Cost</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 100" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                          onChange={(e) => field.onChange(e.target.value)}
                          value={field.value}
                        >
                          {rewardIcons.map((icon) => (
                            <option key={icon.value} value={icon.value}>
                              {icon.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-center justify-between mt-6">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-dark text-white font-bold"
                  disabled={createReward.isPending}
                >
                  {createReward.isPending ? "Adding..." : "Add Reward"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddRewardOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <MobileNav />
    </div>
  );
}
