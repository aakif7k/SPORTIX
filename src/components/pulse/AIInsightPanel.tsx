import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Trophy, Sparkles, Activity, CheckCircle } from 'lucide-react';

export interface AIInsightData {
  teamName: string;
  eventName?: string;
  avgPulse: number;
  highestPulse: number;
  lowestPulse: number;
  pulseSpread: number;
  topPerformerName: string;
  topPerformerUsername: string;
  topPerformerPulse: number;
  rawInsightText?: string;
}

interface Props {
  insightData: AIInsightData | null;
  loading?: boolean;
}

export const AIInsightPanel: React.FC<Props> = ({ insightData, loading }) => {
  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-surface border border-border-muted space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20" />
          <div className="h-4 w-48 bg-elevated rounded" />
        </div>
        <div className="h-20 bg-elevated rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-elevated rounded-2xl" />
          <div className="h-24 bg-elevated rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!insightData) {
    return (
      <div className="p-10 rounded-3xl bg-surface border border-border-muted text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto">
          <Brain size={28} />
        </div>
        <h3 className="font-display text-base text-text-primary uppercase tracking-wide">
          NO TEAM TO ANALYZE
        </h3>
        <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
          Accept or generate a squad first to unlock AI team performance intelligence.
        </p>
      </div>
    );
  }

  // Parse sections if rawInsightText is formatted with headers
  const parseSections = (text?: string) => {
    if (!text) return null;
    const sections: { [key: string]: string } = {};
    const keys = ['TEAM OUTLOOK', 'PULSE ANALYSIS', 'TOP PERFORMER', 'RECOMMENDATION'];
    
    let currentKey = 'TEAM OUTLOOK';
    const lines = text.split('\n');
    let currentBody: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      const matchedKey = keys.find(k => trimmed.toUpperCase().startsWith(k));
      if (matchedKey) {
        if (currentBody.length > 0) {
          sections[currentKey] = currentBody.join(' ').trim();
        }
        currentKey = matchedKey;
        currentBody = [trimmed.replace(new RegExp(`^${matchedKey}:?`, 'i'), '').trim()];
      } else if (trimmed) {
        currentBody.push(trimmed);
      }
    });

    if (currentBody.length > 0) {
      sections[currentKey] = currentBody.join(' ').trim();
    }

    return Object.keys(sections).length > 0 ? sections : null;
  };

  const parsed = parseSections(insightData.rawInsightText);

  const teamOutlook = parsed?.['TEAM OUTLOOK'] ||
    `Squad ${insightData.teamName} exhibits a strong activity profile with high baseline coordination potential across all members.`;

  const pulseAnalysis = parsed?.['PULSE ANALYSIS'] ||
    `The team averages ${insightData.avgPulse} Pulse with a ${insightData.pulseSpread} point spread. Most members maintain consistent participation signals.`;

  const topPerformerText = parsed?.['TOP PERFORMER'] ||
    `${insightData.topPerformerName} (@${insightData.topPerformerUsername}) holds the highest activity signal with ${insightData.topPerformerPulse} Pulse.`;

  const recommendation = parsed?.['RECOMMENDATION'] ||
    `Maintain team activity consistency and focus on early communication to maximize match readiness.`;

  // Calculate word count validation
  const totalCopy = `${teamOutlook} ${pulseAnalysis} ${topPerformerText} ${recommendation}`;
  const wordCount = totalCopy.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-surface border border-border-muted shadow-card relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shadow-glow">
              <Brain size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest px-2 py-0.5 rounded bg-accent/10">
                  SPORTiX AI LAB
                </span>
                <span className="font-mono text-[10px] text-text-muted">
                  Word Count: {wordCount} / 150
                </span>
              </div>
              <h3 className="font-display text-lg text-text-primary tracking-wide uppercase mt-0.5">
                ✦ AI TEAM INTELLIGENCE: {insightData.teamName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-text-muted">AVG PULSE:</span>
            <span className="font-bold text-accent text-sm px-3 py-1 rounded-xl bg-accent/10 border border-accent/30">
              ⚡ {insightData.avgPulse}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Section Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. TEAM OUTLOOK */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl bg-elevated border border-border-muted/70 space-y-2 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={14} /> 1. TEAM OUTLOOK
            </span>
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          </div>
          <p className="font-sans text-xs text-text-primary leading-relaxed">
            {teamOutlook}
          </p>
        </motion.div>

        {/* 2. PULSE ANALYSIS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="p-5 rounded-2xl bg-elevated border border-border-muted/70 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} /> 2. PULSE ANALYSIS
            </span>
            <span className="font-mono text-[10px] text-text-muted">Spread: {insightData.pulseSpread} pts</span>
          </div>
          <p className="font-sans text-xs text-text-primary leading-relaxed">
            {pulseAnalysis}
          </p>
        </motion.div>

        {/* 3. TOP PERFORMER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="p-5 rounded-2xl bg-elevated border border-border-muted/70 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} /> 3. TOP PERFORMER
            </span>
            <span className="font-mono text-[10px] text-accent font-bold">⚡ {insightData.topPerformerPulse} Pulse</span>
          </div>
          <p className="font-sans text-xs text-text-primary leading-relaxed">
            {topPerformerText}
          </p>
        </motion.div>

        {/* 4. RECOMMENDATION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="p-5 rounded-2xl bg-elevated border border-border-muted/70 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle size={14} /> 4. RECOMMENDATION
            </span>
            <span className="font-mono text-[10px] text-text-muted">Actionable</span>
          </div>
          <p className="font-sans text-xs text-text-primary leading-relaxed">
            {recommendation}
          </p>
        </motion.div>
      </div>

      {/* Pulse Visualization Summary */}
      <div className="p-5 rounded-2xl bg-surface border border-border-muted space-y-3">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="text-text-muted uppercase font-bold">Team Pulse Consistency</span>
          <span className="text-accent font-bold">
            Avg: {insightData.avgPulse} • High: {insightData.highestPulse} • Low: {insightData.lowestPulse}
          </span>
        </div>
        <div className="h-2 rounded-full bg-elevated overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (insightData.avgPulse / 1000) * 100)}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full bg-accent"
          />
        </div>
      </div>
    </div>
  );
};
