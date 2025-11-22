import Link from 'next/link';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { id, name, icon, count } = category;

  return (
    <Link href={`/search?category=${encodeURIComponent(name)}`}>
      <div className="card cursor-pointer group hover:scale-105 transition-transform">
        <div className="p-6 text-center">
          {/* Category Icon */}
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
            {icon}
          </div>

          {/* Category Name */}
          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Restaurant Count */}
          <p className="text-sm text-gray-500">
            {count} restaurants
          </p>
        </div>
      </div>
    </Link>
  );
}