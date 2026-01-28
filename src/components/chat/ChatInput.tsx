import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="flex items-end gap-3 p-4 bg-card/80 backdrop-blur-sm border-t border-border">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Escribe cómo te sientes..."}
        disabled={isLoading || disabled}
        className="min-h-[44px] max-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 rounded-xl"
        rows={1}
      />
      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || isLoading || disabled}
        size="icon"
        className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-soft shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
