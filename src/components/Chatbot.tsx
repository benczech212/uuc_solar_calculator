import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, MessageSquare, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { SolarParams } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  params: SolarParams;
  lockedKeys: string[];
  onUpdateParams: (newParams: Partial<SolarParams>) => void;
  externalPrompt?: { text: string; timestamp: number } | null;
}

export function Chatbot({ params, lockedKeys, onUpdateParams, externalPrompt }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your UUC Solar ROI Calculator assistant. I can help set parameters, explain the math, or optimize for a specific goal. What would you like to do?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastHandledPromptRef = useRef<number | null>(null);

  useEffect(() => {
    if (externalPrompt && externalPrompt.timestamp !== lastHandledPromptRef.current) {
      lastHandledPromptRef.current = externalPrompt.timestamp;
      setIsOpen(true);
      setIsMinimized(false);
      
      const userMessage = externalPrompt.text;
      
      setMessages(prev => {
        const updatedMessages: Message[] = [...prev, { role: 'user', text: userMessage }];
        setIsLoading(true);

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            params,
            lockedKeys,
            history: prev
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }

          if (data.functionCall) {
            const changes = { ...data.functionCall };
            delete changes.messageDetails;
            
            const safeChanges: any = {};
            for (const [k, v] of Object.entries(changes)) {
               if (!lockedKeys.includes(k)) {
                   safeChanges[k] = v;
               }
            }
            
            if (Object.keys(safeChanges).length > 0) {
               onUpdateParams(safeChanges);
            }
          }

          setMessages(mPrev => [...mPrev, { role: 'model', text: data.text }]);
        })
        .catch(err => {
          console.error(err);
          setMessages(mPrev => [...mPrev, { role: 'model', text: `Sorry, I encountered an error: ${err.message}` }]);
        })
        .finally(() => {
          setIsLoading(false);
        });

        return updatedMessages;
      });
    }
  }, [externalPrompt, params, lockedKeys, onUpdateParams]);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          params,
          lockedKeys,
          history: messages
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.functionCall) {
        const changes = { ...data.functionCall };
        delete changes.messageDetails;
        
        // Ensure we don't accidentally update locked keys
        const safeChanges: any = {};
        for (const [k, v] of Object.entries(changes)) {
           if (!lockedKeys.includes(k)) {
               safeChanges[k] = v;
           }
        }
        
        if (Object.keys(safeChanges).length > 0) {
           onUpdateParams(safeChanges);
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-6 right-6 p-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-full shadow-lg shadow-amber-500/20 transition-transform active:scale-95 flex items-center gap-2 group z-50"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold text-sm tracking-wide">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className={`fixed right-6 bottom-6 w-[350px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out ${isMinimized ? 'h-14 overflow-hidden' : 'h-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-800/50 rounded-t-2xl cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 text-slate-900 p-1.5 rounded-lg shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-200 text-sm tracking-wide">UUC Solar AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-amber-500 text-slate-900 rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  Analyzing constraints...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700/50 bg-slate-900 rounded-b-2xl">
            <div className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask to optimize or explain..."
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder-slate-500"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-500 disabled:opacity-50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
