import React from 'react';
import { PlantIcon, ChatIcon } from './icons';

type View = 'identifier' | 'chat';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const activeClass = 'bg-green-700 text-white';
  const inactiveClass = 'bg-white text-green-700 hover:bg-green-100';

  return (
    <header className="bg-white rounded-xl shadow-md p-4 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center mb-4 sm:mb-0">
        <PlantIcon className="w-10 h-10 text-green-600" />
        <h1 className="text-2xl font-bold text-green-800 ml-3">Bog'dorchilik Yordamchisi</h1>
      </div>
      <nav className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setCurrentView('identifier')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 flex items-center space-x-2 ${
            currentView === 'identifier' ? activeClass : inactiveClass
          }`}
        >
          <PlantIcon className="w-5 h-5" />
          <span>O'simlikni Aniqlash</span>
        </button>
        <button
          onClick={() => setCurrentView('chat')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors duration-300 flex items-center space-x-2 ${
            currentView === 'chat' ? activeClass : inactiveClass
          }`}
        >
          <ChatIcon className="w-5 h-5" />
          <span>Bog'dorchilik Chati</span>
        </button>
      </nav>
    </header>
  );
};

export default Header;