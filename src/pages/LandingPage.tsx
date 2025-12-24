import React from 'react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import WhyChoose from '../components/landing/WhyChoose';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Hero />
            <Features />
            <HowItWorks />
            <WhyChoose />
            <CTA />
            <Footer />
        </div>
    );
};

export default LandingPage;