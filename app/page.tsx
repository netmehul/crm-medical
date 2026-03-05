import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import ProblemSolution from "@/components/landing/ProblemSolution";
import FeaturesShowcase from "@/components/landing/FeaturesShowcase";
import ModuleTabs from "@/components/landing/ModuleTabs";
import HowItWorks from "@/components/landing/HowItWorks";
import StatsSection from "@/components/landing/StatsSection";
import Testimonials from "@/components/landing/Testimonials";
import Pricing from "@/components/landing/Pricing";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "MediCRM — The CRM That Thinks Like a Doctor",
  description:
    "Manage patients, appointments, prescriptions, inventory and your entire clinic from one beautifully designed platform. Trusted by 500+ clinics.",
  openGraph: {
    title: "MediCRM — Clinic Management, Reimagined",
    description:
      "From patient intake to prescription to follow-up — all in one place.",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <ProblemSolution />
      <FeaturesShowcase />
      <ModuleTabs />
      <HowItWorks />
      <StatsSection />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
