import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface MemberCardProps {
  member: User;
}

export default function MemberCard({ member }: MemberCardProps) {
  const initials = member.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const roleColor = member.roleType === "parent" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary";
  const roleLabel = member.roleType === "parent" ? "Parent" : "Child";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center space-x-4">
          <Avatar className="h-14 w-14 border-2 border-white shadow-sm" style={{ backgroundColor: member.avatarColor }}>
            <AvatarFallback className="text-white font-medium text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{member.displayName}</h3>
                <p className="text-sm text-muted-foreground">@{member.username}</p>
              </div>
              <Badge className={`${roleColor} px-2 py-1 rounded text-xs`}>
                {roleLabel}
              </Badge>
            </div>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <div className="flex items-center mr-4">
                <i className="ri-star-line mr-1"></i>
                <span>{member.points || 0} points</span>
              </div>
              <div className="flex items-center">
                <i className="ri-medal-line mr-1"></i>
                <span>Level {member.level || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}