
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

interface DebugChatProps {
  code: string;
  variables: Array<{ name: string; value: any; changed: boolean; }>;
  currentLine: number;
}

const DebugChat: React.FC<DebugChatProps> = ({ code, variables, currentLine }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Debug Chat! Ask questions about your code execution or how to use the debugger.',
      sender: 'system',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Generate simple responses based on keywords
    setTimeout(() => {
      let responseText = '';
      const lowerInput = inputText.toLowerCase();
      
      if (lowerInput.includes('help')) {
        responseText = 'You can use the control panel to step forward, backward, or use checkpoints. The code viewer shows your current line, and the state viewer shows all variables.';
      } else if (lowerInput.includes('line') || lowerInput.includes('current')) {
        responseText = `You're currently at line ${currentLine} of your code.`;
      } else if (lowerInput.includes('variable') || lowerInput.includes('value')) {
        const varInfo = variables.map(v => `${v.name}: ${JSON.stringify(v.value)}`).join(', ');
        responseText = `Current variables: ${varInfo}`;
      } else if (lowerInput.includes('error') || lowerInput.includes('problem')) {
        responseText = 'To debug errors, try stepping through the code line by line and watch how variables change in the state viewer.';
      } else if (lowerInput.includes('checkpoint')) {
        responseText = 'Checkpoints let you mark important points in your execution that you can jump back to later.';
      } else if (lowerInput.includes('save') || lowerInput.includes('export')) {
        responseText = 'Your debugging session is automatically saved to your account through Supabase.';
      } else {
        responseText = 'I\'m a simple debug assistant. Try asking about the current line, variables, or how to use the debugger features.';
      }
      
      const systemMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'system',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, systemMsg]);
    }, 500);
  };

  return (
    <>
      {/* Floating chat button */}
      <Button
        className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      
      {/* Chat interface */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-96 h-96 shadow-xl animate-fade-in glass-panel flex flex-col">
          <div className="p-3 border-b bg-primary/10 font-semibold flex justify-between items-center">
            <span>Debug Assistant</span>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>×</Button>
          </div>
          
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Ask about your code..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-grow"
            />
            <Button size="icon" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};

export default DebugChat;
