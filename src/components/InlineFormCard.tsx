import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft } from "lucide-react";

interface InlineFormCardProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
  isVisible: boolean;
  className?: string;
}

export const InlineFormCard: React.FC<InlineFormCardProps> = ({
  title,
  children,
  onClose,
  onBack,
  isVisible,
  className = "",
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Only close if clicking the overlay, not the card content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Card
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {title}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
};
