import { Heart, MessageSquare, Search } from 'lucide-react';
import type { ComponentType } from 'react';
import { SectionHeader } from './SectionHeader';

interface Step {
  number: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Search,
    title: 'Search',
    description:
      'Browse thousands of verified listings with powerful filters. Search by suburb, price, bedrooms, and more.',
  },
  {
    number: '02',
    icon: Heart,
    title: 'Save & Compare',
    description:
      'Save your favourite properties to collections and compare them side-by-side to make smarter decisions.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Enquire',
    description:
      'Contact agents directly from any listing. Get responses fast and arrange inspections with ease.',
  },
];

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <Icon className="w-10 h-10 text-white" />
        <span className="absolute -bottom-2 -right-2 text-xs font-bold bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-white">
          {step.number}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-white mt-2 mb-2">{step.title}</h3>
      <p className="text-white/75 text-sm leading-relaxed">{step.description}</p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="py-16 bg-brand-primary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SectionHeader
          title="Find your dream home in 3 steps"
          light
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
