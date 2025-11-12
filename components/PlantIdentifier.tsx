import React, { useState, useCallback } from 'react';
import { analyzePlantImage, toBase64 } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon } from './icons';

const PlantIdentifier: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis('');
      setError('');
    }
  };

  const handleIdentifyClick = useCallback(async () => {
    if (!imageFile) {
      setError('Iltimos, avval rasm tanlang.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const base64Image = await toBase64(imageFile);
      const result = await analyzePlantImage(base64Image, imageFile.type);
      setAnalysis(result);
    } catch (err) {
      setError('Tahlil paytida xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
      <h2 className="text-xl font-semibold text-green-800 mb-4">O'simlikni Aniqlang</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="plant-upload"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
        />
        <label
          htmlFor="plant-upload"
          className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-700 hover:bg-green-800 transition"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          {imageFile ? 'Rasmni O\'zgartirish' : 'Rasm Yuklash'}
        </label>
        <p className="mt-2 text-sm text-gray-500">PNG, JPG, GIF 10MB gacha</p>
      </div>

      {previewUrl && (
        <div className="mt-6 flex flex-col items-center">
          <img src={previewUrl} alt="Plant preview" className="max-h-64 rounded-lg shadow-md mb-4" />
          <button
            onClick={handleIdentifyClick}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? 'Tahlil qilinmoqda...' : "O'simlikni Aniqlash"}
          </button>
        </div>
      )}

      {isLoading && <LoadingSpinner />}
      
      {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      
      {analysis && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Tahlil Natijasi</h3>
          <div className="prose prose-green max-w-none whitespace-pre-wrap">{analysis}</div>
        </div>
      )}
    </div>
  );
};

export default PlantIdentifier;