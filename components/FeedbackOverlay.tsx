import React from 'react';

export interface FeedbackOverlayProps {
  feedback: { text: string; type: 'success' | 'error' | 'neutral' | 'info' } | null;
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ feedback }) => {
  if (!feedback) return null;
  return (
    <div className="mb-6 flex justify-center pointer-events-none">
      <div className={`px-8 py-3 rounded-2xl font-black text-lg shadow-2xl border-2 transition-all animate-pop ${feedback.type === 'error' ? 'bg-red-600 text-white border-red-400' : feedback.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-white border-slate-600'}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default FeedbackOverlay;
