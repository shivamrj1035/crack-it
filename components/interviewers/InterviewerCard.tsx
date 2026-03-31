"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Code, Edit, Trash, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewerCardProps {
  interviewer: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    skills: string[];
    difficulty: string;
    defaultQuestionCount: number;
    estimatedDuration: number;
    isDefault: boolean;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onStartInterview?: () => void;
}

export function InterviewerCard({
  interviewer,
  onEdit,
  onDelete,
  onStartInterview,
}: InterviewerCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "junior":
        return "bg-green-100 text-green-800";
      case "mid":
        return "bg-blue-100 text-blue-800";
      case "senior":
        return "bg-purple-100 text-purple-800";
      case "principal":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displaySkills = interviewer.skills.slice(0, 5);
  const remainingSkills = interviewer.skills.length - 5;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                interviewer.color ? "" : "bg-gray-100"
              )}
              style={interviewer.color ? { backgroundColor: interviewer.color + "20" } : {}}
            >
              <Code
                className="w-5 h-5"
                style={interviewer.color ? { color: interviewer.color } : {}}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{interviewer.name}</CardTitle>
              <CardDescription className="text-sm">
                {interviewer.slug}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {interviewer.isDefault && (
              <Badge variant="secondary">Default</Badge>
            )}
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={interviewer.isDefault}
              >
                <Trash className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {interviewer.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {interviewer.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {displaySkills.map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {remainingSkills > 0 && (
            <Badge variant="outline" className="text-xs">
              +{remainingSkills} more
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{interviewer.estimatedDuration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{interviewer.defaultQuestionCount} questions</span>
          </div>
          <Badge className={cn("text-xs", getDifficultyColor(interviewer.difficulty))}>
            {interviewer.difficulty}
          </Badge>
        </div>

        <Button className="w-full" onClick={onStartInterview}>
          <Play className="w-4 h-4 mr-2" />
          Start Interview
        </Button>
      </CardContent>
    </Card>
  );
}
