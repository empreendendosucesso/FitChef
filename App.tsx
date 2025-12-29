
import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Loader2, 
  AlertCircle, 
  History, 
  Heart, 
  Settings, 
  ExternalLink,
  CheckCircle2,
  Sparkles,
  MousePointerClick,
  Gift,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Recipe, UsageData } from './types';
import { generateFitRecipe, generateRecipeImage } from './geminiService';
import RecipeCard from './components/RecipeCard';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const DAILY_LIMIT = 10;
const HISTORY_KEY = 'fitchef_history';
const SETUP_KEY = 'fitchef_setup_complete';

const App: React.FC = () => {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData>({ count: 0, lastDate: new Date().toLocaleDateString() });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const setup = localStorage.getItem(SETUP_KEY);
    setIsSetupComplete(setup === 'true');
    
    const storedUsage = localStorage.getItem('fitchef_usage');
    if (storedUsage) {
      const data = JSON.parse(storedUsage);
      if (data.lastDate === new Date().toLocaleDateString()) setUsage(data);
    }

    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  const handleCompleteSetup = () => {
    localStorage.setItem(SETUP_KEY, 'true');
    setIsSetupComplete(true);
    setShowConfig(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    if (!isSetupComplete) {
      setShowConfig(true);
      return;
    }

    if (usage.count >= DAILY_LIMIT) {
      setError(`Limite diário atingido (${DAILY_LIMIT}/dia). Volte amanhã para mais receitas!`);
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);
    setLoadingStage('Consultando o nutricionista digital...');

    try {
      const newRecipe = await generateFitRecipe(query);
      setLoadingStage('Gerando fotografia culinária...');
      const imageUrl = await generateRecipeImage(newRecipe.name);
      
      const completeRecipe = { ...newRecipe, imageUrl, id: Date.now().toString() };
      setRecipe(completeRecipe);
      
      const updatedHistory = [completeRecipe, ...history].slice(0, 15);
      setHistory(updatedHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

      const newUsage = { ...usage, count: usage.count + 1 };
      setUsage(newUsage);
      localStorage.setItem('fitchef_usage', JSON.stringify(newUsage));
    } catch (err: any) {
      setError('Tivemos um problema técnico. Verifique se sua conexão está ativa e tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!recipe) return;
    setIsExporting(true);
    try {
      const element = document.getElementById('recipe-content');
      if (!element) return;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FITCHEF-${recipe.name}.pdf`);
    } catch (err) {
      alert('Não conseguimos gerar o PDF agora.');
    } finally { setIsExporting(false); }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] flex flex-col font-sans selection:bg-emerald-100">
      
      <header className="pt-8 pb-4 px-6 max-w-4xl mx-auto w-full flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <ChefHat size={28} />
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight text-center uppercase">FitChef da Nutri</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowConfig(true)}
            className={`p-4 rounded-2xl transition-all relative flex items-center justify-center ${isSetupComplete ? 'text-emerald-600 bg-white border border-emerald-100 shadow-sm hover:bg-emerald-50' : 'text-white bg-amber-500 shadow-2xl shadow-amber-300 ring-8 ring-amber-100 animate-bounce'}`}
          >
            <Settings size={26} />
            {!isSetupComplete && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="px-6 flex-grow flex flex-col">
        
        {!isSetupComplete && !loading && !recipe && (
          <div className="max-w-4xl mx-auto mt-6 mb-12 w-full animate-in fade-in zoom-in duration-700">
            <div className="bg-white border-4 border-emerald-50 rounded-[3.5rem] p-8 md:p-14 shadow-2xl shadow-emerald-100/40 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Gift size={200} />
              </div>

              <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 text-center md:text-left">
                  <div className="bg-emerald-600 w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-200 mx-auto md:mx-0">
                    <Sparkles size={40} className="text-white animate-pulse" />
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                    Ative seu <br/> 
                    <span className="text-emerald-600">FitChef da Nutri!</span>
                  </h2>

                  <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
                    Siga os passos abaixo para liberar sua cozinha inteligente agora mesmo. <br/>
                    <span className="text-emerald-700 font-bold italic">Grátis, rápido e funcional.</span>
                  </p>

                  <div className="hidden md:flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 size={18} /> Sem taxas ou mensalidades
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 size={18} /> Chaves gratuitas permanentes
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-10 border-2 border-slate-100 shadow-sm relative">
                    <h4 className="flex items-center justify-center md:justify-start gap-3 text-emerald-700 font-black uppercase text-[10px] tracking-[0.3em] mb-8">
                      Instruções de Ativação
                    </h4>
                    
                    <div className="space-y-8">
                      <div className="flex gap-4">
                        <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0 text-sm mt-1">1</div>
                        <div className="w-full text-left">
                          <p className="text-sm font-bold text-slate-800 mb-4 leading-relaxed">
                            No site do Google AI Studio, clique no botão azul <span className="text-emerald-600 font-black">"Create API Key"</span> localizado no canto superior direito da tela.
                          </p>
                          <a 
                            href="https://aistudio.google.com/api-keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-center transition-all shadow-xl shadow-slate-200 transform hover:scale-[1.02] active:scale-95 mb-2 group animate-pulse-black"
                          >
                            Abrir Google AI Studio (Grátis) <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0 text-sm mt-1">2</div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800 mb-1 leading-relaxed">
                            Crie o projeto <span className="text-emerald-600 font-black uppercase">FITCHEF</span> e a chave <span className="text-emerald-600 font-black uppercase">FITCHEF</span>.
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold italic leading-tight">
                            Isso facilita a identificação da sua conta gratuita.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0 text-sm mt-1">3</div>
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-4 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <Info size={16} className="text-emerald-600 shrink-0" />
                            <p className="text-[11px] font-bold text-emerald-800 leading-tight">
                              Já gerou a chave no Google? Clique no botão abaixo para concluir.
                            </p>
                          </div>
                          <button 
                            onClick={handleCompleteSetup}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-center transition-all shadow-xl shadow-emerald-200 active:scale-95 group"
                          >
                            Concluir Ativação <MousePointerClick size={18} className="group-hover:animate-bounce" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`transition-all duration-1000 flex-grow flex flex-col ${!isSetupComplete ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'}`}>
          <div className="max-w-3xl mx-auto text-center mt-8 mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
              FitChef da <br/> 
              <span className="text-emerald-600 italic">Nutri.</span>
            </h2>
            <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Transforme seu desejo em um prato saudável com um toque especial do FitChef.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-16 w-full">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: quero criar um prato de wrap de frango com molho de yogurte"
                className="w-full bg-white text-slate-900 text-xl py-6 px-8 pr-32 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border-2 border-transparent focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-3 top-3 bottom-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-[1.8rem] font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Criar'}
              </button>
            </form>
            
            <div className="mt-6 flex justify-center items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <span className="bg-slate-100 px-3 py-1 rounded-full">{usage.count} de {DAILY_LIMIT} hoje</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
              <span className="text-emerald-500 font-bold">🟢 IA GRATUITA ATIVA</span>
            </div>
          </div>

          {loading && (
            <div className="max-w-md mx-auto py-20 text-center animate-in fade-in duration-500">
              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Loader2 size={80} className="text-emerald-600 animate-spin opacity-20 absolute" />
                <ChefHat size={32} className="text-emerald-600 animate-bounce relative" />
              </div>
              <p className="text-xl font-bold text-slate-800 mb-2">Preparando sua receita...</p>
              <p className="text-slate-400 font-medium">{loadingStage}</p>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-start gap-4 mb-12 animate-in zoom-in duration-300">
              <AlertCircle className="shrink-0 mt-1" />
              <div>
                <p className="font-bold mb-1 text-left">Ops!</p>
                <p className="text-sm opacity-90 leading-relaxed text-left">{error}</p>
              </div>
            </div>
          )}

          {recipe && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <RecipeCard recipe={recipe} onExport={handleExportPdf} isExporting={isExporting} />
            </div>
          )}

          {history.length > 0 && !loading && (
            <div className="max-w-4xl mx-auto mt-20 pb-20">
              <div className="flex items-center justify-between mb-8 px-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <History className="text-emerald-600" size={24} /> 
                  Recentes
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {history.map((h) => (
                  <button 
                    key={h.id} 
                    onClick={() => { setRecipe(h); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    className={`group flex flex-col p-4 rounded-[2rem] bg-white border-2 transition-all hover:shadow-xl ${recipe?.id === h.id ? 'border-emerald-500 shadow-emerald-100' : 'border-slate-50'}`}
                  >
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 mb-4">
                      {h.imageUrl ? <img src={h.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <ChefHat className="w-full h-full p-8 text-slate-100" />}
                    </div>
                    <div className="text-left px-1">
                      <p className="font-bold text-slate-900 truncate mb-1">{h.name}</p>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{h.macros.calories} CAL</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto pb-12 px-6 text-center">
        <p className="text-slate-300 text-xs font-bold tracking-wide flex items-center justify-center gap-2">
          ❤️ Feito com amor FitChef da Nutri © 2025
        </p>
      </footer>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-10 bg-emerald-600 text-white text-center shrink-0">
              <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <h3 className="text-3xl font-black leading-tight">Painel FitChef</h3>
              <p className="text-emerald-50 opacity-80 mt-2 font-medium">Configuração de acesso gratuito.</p>
            </div>
            <div className="p-10 space-y-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Status do Sistema</p>
                  <p className="text-slate-900 font-bold">IA Gratuita Ativa</p>
                </div>
                <div className="text-emerald-600 p-2 rounded-full">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>Acesso via Google AI Studio</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 text-sm">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>Limite de {DAILY_LIMIT} receitas diárias</span>
                </div>
              </div>

              <div className="space-y-3">
                <a 
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[1.8rem] shadow-xl transition-all flex items-center justify-center gap-3 text-xl active:scale-95 group animate-pulse-black"
                >
                  Atualizar Conexão <ExternalLink size={24} />
                </a>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center"
                >
                  Fechar
                </button>
              </div>
            </div>
            <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-center bg-slate-50/50">
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest text-center">
                FitChef da Nutri © 2025 - Tecnologia Gemini Flash
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
