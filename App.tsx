
import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Search, Loader2, AlertCircle, History, Info, Trash2, ChevronRight, Lightbulb, Heart } from 'lucide-react';
import { Recipe, UsageData } from './types';
import { generateFitRecipe, generateRecipeImage } from './geminiService';
import RecipeCard from './components/RecipeCard';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const DAILY_LIMIT = 10;
const HISTORY_KEY = 'fitchef_history';

const HEALTHY_TIPS = [
  "Utilize azeite de oliva extra virgem para finalizar pratos, preservando seus nutrientes.",
  "Cozinhe o feijão com água filtrada; além de mais saudável, ele fica mais saboroso.",
  "Inclua linhaça ou sementes de chia na sua salada para um aporte extra de fibras e ômega-3.",
  "Em receitas de bolos fit, prefira óleo de coco extra-virgem e farinhas sem glúten como a de amêndoas ou aveia.",
  "Use sempre legumes frescos e bem lavados para garantir o máximo de vitaminas e minerais.",
  "Evite gorduras hidrogenadas e alimentos ultraprocessados; prefira sempre o natural.",
  "Substitua o sal comum por ervas frescas ou especiarias para realçar o sabor sem elevar o sódio.",
  "Mantenha-se hidratado: beber água ajuda na digestão e no controle do apetite.",
  "Prefira métodos de cozimento como vapor ou grelhados para manter a integridade dos alimentos.",
  "O alho e a cebola são antibióticos naturais; use-os generosamente no seu tempero caseiro."
];

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData>({ count: 0, lastDate: new Date().toLocaleDateString() });
  const [isExporting, setIsExporting] = useState(false);

  // Determine daily tip based on the date
  const dailyTip = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return HEALTHY_TIPS[dayOfYear % HEALTHY_TIPS.length];
  }, []);

  // Load usage and history on mount
  useEffect(() => {
    // Load Usage
    const storedUsage = localStorage.getItem('fitchef_usage');
    const today = new Date().toLocaleDateString();
    
    if (storedUsage) {
      const data = JSON.parse(storedUsage) as UsageData;
      if (data.lastDate === today) {
        setUsage(data);
      } else {
        const newData = { count: 0, lastDate: today };
        setUsage(newData);
        localStorage.setItem('fitchef_usage', JSON.stringify(newData));
      }
    }

    // Load History
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const saveToHistory = (newRecipe: Recipe) => {
    const updatedHistory = [newRecipe, ...history].slice(0, 20); // Keep last 20 recipes
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if (window.confirm('Deseja limpar todo o seu histórico de receitas?')) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    if (usage.count >= DAILY_LIMIT) {
      setError(`Você atingiu o limite diário de ${DAILY_LIMIT} receitas. Volte amanhã para mais inspiração!`);
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);
    setLoadingStage('Consultando bases nutricionais...');

    try {
      const newRecipe = await generateFitRecipe(query);
      
      setLoadingStage('Criando uma imagem apetitosa...');
      const imageUrl = await generateRecipeImage(newRecipe.name);
      
      const completeRecipe = { ...newRecipe, imageUrl, id: Date.now().toString() };
      setRecipe(completeRecipe);
      saveToHistory(completeRecipe);

      // Update usage
      const newCount = usage.count + 1;
      const newUsage = { ...usage, count: newCount };
      setUsage(newUsage);
      localStorage.setItem('fitchef_usage', JSON.stringify(newUsage));

    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao gerar sua receita. Verifique sua conexão ou tente outro prato.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleExportPdf = async () => {
    if (!recipe) return;
    setIsExporting(true);
    
    try {
      const element = document.getElementById('recipe-content');
      if (!element) throw new Error("Element not found");

      // Temporarily hide buttons for export
      const buttons = element.querySelectorAll('button');
      if (buttons) buttons.forEach(btn => btn.style.display = 'none');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      if (buttons) buttons.forEach(btn => btn.style.display = 'flex');

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fitchef-receita-${recipe.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10 flex flex-col">
      <div className="flex-grow">
        {/* Header */}
        <header className="pt-12 pb-8 px-6 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200 text-white animate-subtle">
              <ChefHat size={32} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">FitChef da Nutri</h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            Transforme seu desejo em um prato saudável com um toque especial do FitChef.
          </p>
        </header>

        {/* Main UI */}
        <main className="px-6">
          <div className="max-w-2xl mx-auto mb-12">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={24} />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Wrap de frango com molho de yogurt e ervas"
                className="w-full bg-white text-gray-800 text-lg py-5 pl-16 pr-32 rounded-3xl shadow-xl shadow-gray-200/50 border-2 border-transparent focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-3 top-3 bottom-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                Criar
              </button>
            </form>

            {/* Usage Counter */}
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <History size={14} /> 
                Limite diário: {usage.count} / {DAILY_LIMIT}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="flex items-center gap-1">
                <Info size={14} />
                Uma receita por vez
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="max-w-md mx-auto py-12 text-center">
              <div className="flex justify-center mb-6">
                <Loader2 size={48} className="text-emerald-600 animate-spin" />
              </div>
              <p className="text-xl font-medium text-gray-700 mb-2">Cozinhando algo especial...</p>
              <p className="text-gray-500 animate-pulse">{loadingStage}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-4 text-red-700 mb-12">
              <AlertCircle className="shrink-0 mt-0.5" size={24} />
              <div>
                <p className="font-bold mb-1">Ops!</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Recipe Display */}
          {recipe && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <RecipeCard 
                recipe={recipe} 
                onExport={handleExportPdf} 
                isExporting={isExporting} 
              />
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && !loading && (
            <div className="max-w-4xl mx-auto mt-16 border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <History className="text-emerald-600" />
                  Receitas Recentes
                </h3>
                <button 
                  onClick={clearHistory}
                  className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Trash2 size={16} /> Limpar Histórico
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setRecipe(h);
                      setQuery('');
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`group relative flex items-center p-3 rounded-2xl border transition-all hover:shadow-md text-left ${
                      recipe?.id === h.id 
                        ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500' 
                        : 'bg-white border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-50 shrink-0">
                      {h.imageUrl ? (
                        <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-300">
                          <ChefHat size={24} />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 pr-6 overflow-hidden">
                      <h4 className="font-bold text-gray-900 truncate text-sm">{h.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{h.macros.calories} cal</p>
                    </div>
                    <ChevronRight size={16} className="absolute right-3 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer / Info Section */}
      <footer className="mt-16 px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Daily Tip Card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-emerald-600 p-4 rounded-2xl text-white shrink-0 shadow-lg shadow-emerald-200">
              <Lightbulb size={28} />
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-emerald-900 font-bold text-lg mb-1">Dica do dia:</h4>
              <p className="text-emerald-800 text-lg leading-relaxed">{dailyTip}</p>
            </div>
          </div>

          {/* Slogan */}
          <div className="flex flex-col items-center justify-center gap-2 opacity-60 transition-opacity hover:opacity-100">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <Heart size={18} fill="currentColor" className="animate-pulse" />
              <span>Feito com amor</span>
            </div>
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">FitChef da Nutri &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
