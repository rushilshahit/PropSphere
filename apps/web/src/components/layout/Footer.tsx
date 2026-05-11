import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const SOCIAL_LINKS = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

const COLUMNS = [
  {
    heading: 'Buy',
    links: [
      { label: 'Properties for Sale', to: '/buy' },
      { label: 'New Listings', to: '/buy?sortBy=newest' },
      { label: 'Auctions', to: '/buy?saleMethod=auction' },
    ],
    heading2: 'Rent',
    links2: [
      { label: 'Properties for Rent', to: '/rent' },
      { label: 'Recently Listed', to: '/rent?sortBy=newest' },
    ],
  },
  {
    heading: 'Tools',
    links: [
      { label: 'Repayment Calculator', to: '/finance' },
      { label: 'Stamp Duty Calculator', to: '/finance' },
      { label: 'Borrow Capacity', to: '/finance' },
    ],
    heading2: 'Information',
    links2: [
      { label: 'Suburb Profiles', to: '/suburb' },
      { label: 'Market News', to: '#' },
      { label: 'Buying Guide', to: '#' },
    ],
  },
  {
    heading: 'Agents',
    links: [
      { label: 'Find an Agent', to: '/agents' },
      { label: 'List Your Property', to: '/dashboard' },
      { label: 'Agent Login', to: '/dashboard' },
    ],
    heading2: 'Company',
    links2: [
      { label: 'About Us', to: '#' },
      { label: 'Contact', to: '#' },
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Use', to: '#' },
    ],
  },
];

function FooterLink({ label, to }: { label: string; to: string }) {
  return (
    <li>
      <Link
        to={to}
        className="text-neutral-400 hover:text-white transition-colors text-sm"
      >
        {label}
      </Link>
    </li>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white font-semibold text-sm uppercase tracking-wide mb-3">{children}</p>
  );
}

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-bold mb-1">PropSphere</p>
            <p className="text-neutral-400 text-sm mb-2">Find your place.</p>
            <p className="text-neutral-500 text-sm mb-4">
              The easiest way to buy, rent, and sell property in India.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2-4 */}
          {COLUMNS.map((col, i) => (
            <div key={i}>
              <FooterHeading>{col.heading}</FooterHeading>
              <ul className="space-y-2 mb-5">
                {col.links.map((l) => (
                  <FooterLink key={l.label} label={l.label} to={l.to} />
                ))}
              </ul>
              <FooterHeading>{col.heading2}</FooterHeading>
              <ul className="space-y-2">
                {col.links2.map((l) => (
                  <FooterLink key={l.label} label={l.label} to={l.to} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} PropSphere. All rights reserved.</p>
          <p className="flex gap-4">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Use</Link>
            <Link to="#" className="hover:text-white transition-colors">Contact</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
