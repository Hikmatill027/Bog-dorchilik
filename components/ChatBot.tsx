import React, { useState, useRef, useEffect } from 'react';
import { Chat, Part } from '@google/genai';
import { createChatSession, toBase64, fileToGenerativePart } from '../services/geminiService';
import { ChatMessage } from '../types';
import { BotIcon, UserIcon, SendIcon, PaperclipIcon, CloseIcon } from './icons';

const CHAT_HISTORY_KEY = 'gardening-chat-history';

const ChatBot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initChat = () => {
        let initialMessages: ChatMessage[] = [];
        try {
            const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                    initialMessages = parsedHistory;
                }
            }
        } catch (error) {
            console.error("Could not load chat history:", error);
            localStorage.removeItem(CHAT_HISTORY_KEY);
        }

        if (initialMessages.length === 0) {
            initialMessages = [
                { role: 'model', content: "Salom! Men Bloom, sizning sun'iy intellektli bog'dorchilik yordamchingizman. O'simliklar haqida istalgan savolingizni bering yoki rasm yuklang!" }
            ];
        }
        
        setMessages(initialMessages);
        setChat(createChatSession(initialMessages));
    };
    initChat();
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Save history if a conversation has started (more than the initial message)
    if (messages.length > 1) {
        try {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error("Could not save chat history:", error);
        }
    }
  }, [messages]);
  
  const handleFileSelect = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      // You could add a user-facing error here
      console.error("Selected file is not an image.");
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0] || null);
    event.target.value = ''; // Reset file input to allow selecting the same file again
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userInput.trim() && !imageFile) || isLoading || !chat) return;

    // Stash current state before resetting
    const originalUserInput = userInput;
    const currentImageFile = imageFile;
    const currentImagePreviewUrl = imagePreviewUrl;

    const isIdentificationOnly = !!currentImageFile && !originalUserInput.trim();

    // Add user message to chat history, unless it's a pure identification request
    if (!isIdentificationOnly) {
        const userMessage: ChatMessage = { role: 'user', content: originalUserInput, imageUrl: currentImagePreviewUrl };
        setMessages((prev) => [...prev, userMessage]);
    }

    setIsLoading(true);

    // Reset inputs immediately
    setUserInput('');
    setImageFile(null);
    setImagePreviewUrl(null);

    try {
      const parts: Part[] = [];
      let promptText = originalUserInput.trim();

      if (currentImageFile) {
        const base64Image = await toBase64(currentImageFile);
        parts.push(fileToGenerativePart(base64Image, currentImageFile.type));
        
        if (isIdentificationOnly) {
          // Use the detailed plant ID prompt for identification-only requests
          promptText = `
            Siz botanik va bog'dorchilik bo'yicha mutaxassissiz. Ushbu rasmdagi o'simlikni aniqlang.
            Quyidagi ma'lumotlarni tushunarli, oson o'qiladigan markdown formatida taqdim eting:
            - **Umumiy Nom(lar)i:**
            - **Ilmiy Nomi:**
            - **Tavsifi:** O'simlik haqida qisqacha ma'lumot.
            - **Parvarishlash Yo'riqnomasi:**
              - **Quyosh Nuri:** (masalan, Yorqin, bilvosita yorug'lik)
              - **Sug'orish:** (masalan, Tuproqning yuqori qatlami quriganda sug'oring)
              - **Tuproq:** (masalan, Yaxshi drenajlangan tuproq aralashmasi)
              - **Harorat va Namlik:**
              - **O'g'it:**
            - **Zaharliligi:** Uy hayvonlari yoki odamlar uchun zaharli-mi?
          `;
        }
      }
      
      if (promptText) {
          parts.push({ text: promptText });
      }

      if (parts.length === 0) {
        setIsLoading(false);
        return;
      }
      
      const response = await chat.sendMessage({ message: { parts } });

      const modelMessage: ChatMessage = { 
          role: 'model', 
          content: response.text,
          // If it was an identification-only request, attach the image to the model's response bubble.
          imageUrl: isIdentificationOnly ? currentImagePreviewUrl : undefined 
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = { role: 'model', content: "Kechirasiz, ulanishda muammo yuzaga keldi. Iltimos, keyinroq qayta urinib ko'ring." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div 
        className="bg-white rounded-lg shadow-lg flex flex-col h-[75vh] animate-fade-in relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
    >
        {isDragging && (
            <div className="absolute inset-0 bg-green-100 bg-opacity-75 border-4 border-dashed border-green-500 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                <p className="text-xl font-semibold text-green-700">Yuklash uchun rasmni tashlang</p>
            </div>
        )}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-green-800">Bloom bilan Suhbat</h2>
      </div>
      <div ref={chatWindowRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <BotIcon className="w-8 h-8 flex-shrink-0 text-green-600" />}
            <div className={`px-4 py-2 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-green-100 rounded-bl-none'}`}>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="User upload" className="rounded-md mb-2 max-w-xs max-h-48" />
              )}
              {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
            </div>
            {msg.role === 'user' && <UserIcon className="w-8 h-8 flex-shrink-0 text-gray-500" />}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <BotIcon className="w-8 h-8 flex-shrink-0 text-green-600" />
            <div className="px-4 py-2 rounded-lg bg-green-100 rounded-bl-none">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        {imagePreviewUrl && (
            <div className="mb-2 p-2 bg-gray-100 rounded-lg relative w-28">
                <img src={imagePreviewUrl} alt="Preview" className="h-24 w-24 object-cover rounded" />
                <button 
                    onClick={removeImage} 
                    className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    aria-label="Rasmni o'chirish"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            aria-label="Rasm biriktirish"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Bog'dorchilik haqida so'rang..."
            className="flex-1 p-3 bg-green-700 text-white placeholder-gray-300 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!userInput.trim() && !imageFile)}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
