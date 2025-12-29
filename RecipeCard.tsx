
import React, { useState } from 'react';
import { Recipe } from '../types';
import { 
  Download, 
  CheckCircle, 
  Flame, 
  Target, 
  Zap, 
  Waves, 
  FileDown, 
  Share2, 
  Mail, 
  Twitter, 
  MessageCircle, 
  Link as LinkIcon,
  Check
} from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onExport: () => void;
  isExporting: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onExport, isExporting }) => {
  const [copied, setCopied] = useState(false);

  const recipeSummary = `*${recipe.name}*\n\n${recipe.description}\n\n*Macros:* ${recipe.macros.calories} cal | ${recipe.macros.protein} Prot | ${recipe.macros.carbs} Carb | ${recipe.macros.fat} Gord\n\nConfira essa receita fit no FitChef da Nutri!`;

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(recipeSummary)}`;
    window.open(url, '_blank');
  };

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(recipeSummary)}`;
    window.open(url, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Receita Fit: ${recipe.name}`);
    const body = encodeURIComponent(`Olá! Veja esta receita saudável que encontrei no FitChef da Nutri:\n\n${recipe.name}\n\n${recipe.description}\n\nIngredientes:\n${recipe.ingredients.join('\n')}\n\nModo de Preparo:\n${recipe.instructions.join('\n')}\n\nBom apetite!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recipeSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  return (
    <div id="recipe-content" className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mb-12 relative">
      {/* Botão de Exportação Rápida no Topo */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={onExport}
          disabled={isExporting}
          title="Exportar PDF"
          className="bg-white/90 hover:bg-white text-gray-900 p-3 rounded-2xl shadow-lg backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          ) : (
            <FileDown size={24} className="text-emerald-600" />
          )}
        </button>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-64 md:h-96 w-full">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-200">
            <Zap size={64} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
          <div className="p-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">{recipe.name}</h2>
            <p className="text-emerald-50 text-sm md:text-lg max-w-2xl font-medium drop-shadow-md">{recipe.description}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Macros Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center transition-colors hover:bg-emerald-100">
            <Flame className="text-orange-500 mb-1" size={20} />
            <span className="text-[10px] text-emerald-800 uppercase font-black tracking-widest">Calorias</span>
            <span className="text-xl font-bold text-gray-800">{recipe.macros.calories}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center transition-colors hover:bg-emerald-100">
            <Target className="text-blue-500 mb-1" size={20} />
            <span className="text-[10px] text-emerald-800 uppercase font-black tracking-widest">Proteína</span>
            <span className="text-xl font-bold text-gray-800">{recipe.macros.protein}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center transition-colors hover:bg-emerald-100">
            <Waves className="text-emerald-500 mb-1" size={20} />
            <span className="text-[10px] text-emerald-800 uppercase font-black tracking-widest">Carbos</span>
            <span className="text-xl font-bold text-gray-800">{recipe.macros.carbs}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center transition-colors hover:bg-emerald-100">
            <Zap className="text-yellow-500 mb-1" size={20} />
            <span className="text-[10px] text-emerald-800 uppercase font-black tracking-widest">Gordura</span>
            <span className="text-xl font-bold text-gray-800">{recipe.macros.fat}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Ingredients */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-lg mr-3 shadow-lg shadow-emerald-200">1</span>
              Ingredientes
            </h3>
            <ul className="space-y-4">
              {recipe.ingredients.map((item, idx) => (
                <li key={idx} className="flex items-start text-gray-700 bg-gray-50/50 p-2 rounded-lg">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-1 mr-3" size={18} />
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-lg mr-3 shadow-lg shadow-emerald-200">2</span>
              Modo de Preparo
            </h3>
            <div className="space-y-6">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex items-start">
                  <span className="font-black text-emerald-600 mr-4 text-xl opacity-50">{String(idx + 1).padStart(2, '0')}</span>
                  <p className="text-gray-700 leading-relaxed border-l-2 border-emerald-100 pl-4">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-12 bg-amber-50 border-l-4 border-amber-400 p-8 rounded-2xl">
          <h4 className="font-bold text-amber-900 mb-3 flex items-center text-lg">
            <span className="mr-2">💡</span> Dica de Ouro do Chef Fit
          </h4>
          <p className="text-amber-800 italic leading-relaxed text-lg">"{recipe.tips}"</p>
        </div>

        {/* Compartilhamento e Exportação */}
        <div className="mt-16 flex flex-col items-center border-t border-gray-100 pt-10">
          <div className="flex flex-col items-center mb-10 w-full">
            <h4 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
              <Share2 size={20} className="text-emerald-600" />
              Compartilhe com amigos
            </h4>
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={shareWhatsApp}
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
                title="Compartilhar no WhatsApp"
              >
                <MessageCircle size={28} />
              </button>
              <button 
                onClick={shareTwitter}
                className="bg-sky-400 hover:bg-sky-500 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
                title="Compartilhar no Twitter"
              >
                <Twitter size={28} />
              </button>
              <button 
                onClick={shareEmail}
                className="bg-gray-700 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
                title="Enviar por E-mail"
              >
                <Mail size={28} />
              </button>
              <button 
                onClick={copyToClipboard}
                className={`${copied ? 'bg-emerald-600' : 'bg-indigo-500 hover:bg-indigo-600'} text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center min-w-[60px]`}
                title="Copiar Link da Receita"
              >
                {copied ? <Check size={28} /> : <LinkIcon size={28} />}
              </button>
            </div>
            {copied && <span className="text-emerald-600 text-xs font-bold mt-2 animate-pulse">Copiado para a área de transferência!</span>}
          </div>

          <p className="text-gray-500 text-sm mb-4">Gostou da receita? Leve-a com você!</p>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-5 rounded-3xl font-bold text-lg transition-all shadow-xl shadow-emerald-200 hover:shadow-emerald-300 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                Gerando seu PDF...
              </>
            ) : (
              <>
                <Download size={24} className="group-hover:animate-bounce" />
                Baixar Receita em PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
