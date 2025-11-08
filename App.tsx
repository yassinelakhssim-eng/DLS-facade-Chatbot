import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Message } from './types';
import { SYSTEM_INSTRUCTION, SUGGESTED_QUESTIONS } from './constants';

const BotIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-8 h-8 text-white"
  >
    <path
      fillRule="evenodd"
      d="M4.5 2.25a.75.75 0 000 1.5v16.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5V3.75a.75.75 0 000-1.5h-15zM9 6a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z"
      clipRule="evenodd"
    />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);


const App: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Bonjour, je suis l'assistant virtuel de DLS Façade. Je suis là pour vous aider à obtenir un devis gratuit pour votre projet d'isolation ou de ravalement. Pour commencer, pourriez-vous m'indiquer votre code postal afin que je vérifie si nous intervenons dans votre secteur ?"
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isApiInitializing = useRef(true);


  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const newChatSession = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
        setChatSession(newChatSession);
      } catch (error) {
        console.error("Initialization error:", error);
        setMessages(prev => [...prev, { role: 'model', content: "Désolé, une erreur est survenue lors de l'initialisation de l'assistant. Veuillez rafraîchir la page." }]);
      } finally {
        isApiInitializing.current = false;
      }
    };
    initializeChat();
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading || !chatSession) return;
    
    setShowSuggestions(false);
    setUserInput('');
    setMessages(prev => [...prev, { role: 'user', content: trimmedText }]);
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: trimmedText });
      setMessages(prev => [...prev, { role: 'model', content: response.text }]);
    } catch (error) {
      console.error("API error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Je suis désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chatSession]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(userInput);
  };
  
  return (
    <div className="flex flex-col h-screen bg-brand-light dark:bg-brand-dark text-gray-800 dark:text-gray-200 font-sans">
      <header className="bg-brand-primary text-white p-4 shadow-md z-10">
        <h1 className="text-xl md:text-2xl font-bold text-center">DLS Façade - Assistant Devis</h1>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center shadow-md">
                <BotIcon />
              </div>
            )}
            <div className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
             {msg.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center shadow-md">
                <UserIcon />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
             <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center shadow-md">
                <BotIcon />
              </div>
            <div className="max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl shadow-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
              <div className="flex items-center space-x-2">
                  <span className="text-sm">Je rédige une réponse...</span>
                  <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(q)}
                  className="px-3 py-1.5 bg-brand-light dark:bg-gray-700 text-brand-primary dark:text-gray-200 text-sm rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={isApiInitializing.current ? "Initialisation de l'assistant..." : "Posez votre question ici..."}
              className="flex-1 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
              disabled={isLoading || isApiInitializing.current}
            />
            <button
              type="submit"
              disabled={isLoading || isApiInitializing.current || !userInput.trim()}
              className="flex-shrink-0 w-12 h-12 bg-brand-primary text-white rounded-full flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
};

export default App;
