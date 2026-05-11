import { SectionHeader } from './SectionHeader';

interface NewsArticle {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  imageUrl: string;
  publishedAt: string;
}

const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    category: 'MARKET UPDATE',
    title: 'Ahmedabad property prices rise 8% in Q1 2025',
    excerpt:
      'Western suburbs like Bopal and Thaltej continue to lead growth as infrastructure investment drives demand.',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
    publishedAt: '2025-04-10',
  },
  {
    id: '2',
    category: 'BUYING GUIDE',
    title: 'First-time buyer guide: navigating stamp duty in Gujarat',
    excerpt:
      'Everything you need to know about stamp duty rates, exemptions, and registration fees for property buyers in Gujarat.',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80',
    publishedAt: '2025-03-28',
  },
  {
    id: '3',
    category: 'RENTING',
    title: 'Rental vacancy rates hit 5-year low across Ahmedabad',
    excerpt:
      'Strong demand from IT sector employees is pushing rents higher in Navrangpura and SG Highway corridors.',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&q=80',
    publishedAt: '2025-03-15',
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href="#"
      className="block bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow overflow-hidden group"
    >
      <div className="aspect-[16/9] overflow-hidden rounded-t-card">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary bg-brand-primary/10 rounded px-2 py-0.5">
          {article.category}
        </span>
        <h3 className="text-base font-semibold text-neutral-900 mt-3 mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-neutral-500 line-clamp-3 mb-4">{article.excerpt}</p>
        <div className="flex justify-between items-center text-xs text-neutral-400">
          <span>{article.readTime}</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  );
}

export function MarketNews() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Market Insights"
          subtitle="Stay informed with the latest property news"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NEWS_ARTICLES.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
