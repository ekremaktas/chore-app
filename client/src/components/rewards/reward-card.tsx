import { Reward } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RewardCardProps {
  reward: Reward;
}

export default function RewardCard({ reward }: RewardCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const redeemReward = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const redemptionData = {
        userId: user.id,
        rewardId: reward.id,
        pointsSpent: reward.pointsCost,
      };
      
      const res = await apiRequest("POST", "/api/redemptions", redemptionData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reward Redeemed!",
        description: `You've redeemed ${reward.name} for ${reward.pointsCost} points.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setIsRedeeming(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Redemption Failed",
        description: "You don't have enough points for this reward.",
      });
      setIsRedeeming(false);
    }
  });

  const handleRedeem = () => {
    if (!user) return;
    
    if (user.points < reward.pointsCost) {
      toast({
        variant: "destructive",
        title: "Not Enough Points",
        description: `You need ${reward.pointsCost - user.points} more points for this reward.`,
      });
      return;
    }
    
    setIsRedeeming(true);
    redeemReward.mutate();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-24 bg-${reward.icon.includes("movie") ? "secondary" : reward.icon.includes("game") ? "accent" : "primary"}/20 relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className={`${reward.icon} text-5xl ${reward.icon.includes("movie") ? "text-secondary" : reward.icon.includes("game") ? "text-accent-dark" : "text-primary"}`}></i>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-bold">{reward.name}</h4>
        <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-accent-dark font-bold">
            <i className="ri-coin-line mr-1"></i> {reward.pointsCost}
          </span>
          <Button 
            variant="outline" 
            className="px-3 py-1 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-sm font-bold"
            onClick={handleRedeem}
            disabled={isRedeeming || (user ? user.points < reward.pointsCost : true)}
          >
            {isRedeeming ? "Redeeming..." : "Redeem"}
          </Button>
        </div>
      </div>
    </div>
  );
}
