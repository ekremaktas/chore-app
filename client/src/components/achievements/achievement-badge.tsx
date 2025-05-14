import { Achievement } from "@shared/schema";
import { format } from "date-fns";

interface AchievementBadgeProps {
  achievement: Achievement & { earnedAt?: Date };
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <div className={`flex items-center space-x-3 bg-${achievement.backgroundColor}/10 rounded-lg p-2`}>
      <div className={`w-12 h-12 rounded-full bg-${achievement.backgroundColor} flex items-center justify-center text-white`}>
        <i className={`${achievement.icon} text-xl`}></i>
      </div>
      <div>
        <p className="font-bold">{achievement.name}</p>
        <p className="text-xs text-gray-600">{achievement.description}</p>
        {achievement.earnedAt && (
          <p className="text-xs text-gray-500 mt-1">
            Earned on {format(new Date(achievement.earnedAt), "MMM d, yyyy")}
          </p>
        )}
      </div>
    </div>
  );
}
