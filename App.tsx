
import React, { useState } from 'react';
import Header from './components/Header';
import PlantIdentifier from './components/PlantIdentifier';
import ChatBot from './components/ChatBot';

type View = 'identifier' | 'chat';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('identifier');

  return (
    <div className="min-h-screen bg-green-50 font-sans text-gray-800">
      <div className="container mx-auto p-4 max-w-4xl">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main className="mt-4">
          {currentView === 'identifier' && <PlantIdentifier />}
          {currentView === 'chat' && <ChatBot />}
        </main>
      </div>
    </div>
  );
};

export default App;
