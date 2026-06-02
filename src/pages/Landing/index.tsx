import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { StatsBar } from './StatsBar';
import { PulseShowcase } from './PulseShowcase';
import { AutoSquadShowcase } from './AutoSquadShowcase';
import { Testimonials } from './Testimonials';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

export const LandingIndex: React.FC = () => {
  return (
    <div style={{ background: '#080808', minHeight: '100vh', color: '#fff' }}>
      <LandingNavbar />
      <main>
        <HeroSection />
        <StatsBar />
        <PulseShowcase />
        <AutoSquadShowcase />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingIndex;

