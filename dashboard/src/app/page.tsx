'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatsCard } from '@/components/cards/StatsCard';
import { FileText, Eye, GitBranch, BarChart3, UserCheck, Clock } from 'lucide-react';
import { ViewsTrendChart } from '@/components/charts/ViewsTrendChart';
import { TopPostsBarChart } from '@/components/charts/TopPostsBarChart';

interface Stats {
  totalPosts: number;
  totalViews: bigint;
  totalAccounts: number;
  activeAccounts: number;
  recentRuns: any[];
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topPosts, setTopPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, topPostsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/posts/top?limit=10'),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (topPostsRes.ok) {
          const data = await topPostsRes.json();
          setTopPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Show landing page when not authenticated
  if (status !== 'authenticated' || !session) {
    const totalViewsFormatted = stats ? Number(stats.totalViews).toLocaleString('id-ID') : '--';
    const totalPostsFormatted = stats ? stats.totalPosts.toLocaleString('id-ID') : '--';
    const totalRunsFormatted = stats ? stats.recentRuns.length.toString() : '--';

    return (
      <div className="min-h-screen w-full bg-[#0f1117]">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center">
          <div className="container mx-auto px-4">
            <div className="inline-flex items-center px-4 py-2 bg-purple-900/30 text-purple-300 rounded-full text-sm font-medium mb-6 border border-purple-700">
              🤖 Ditenagai OpenClaw + Playwright
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Tau Konten Instagram<br className="hidden md:block" />Mana yang Paling Viral
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              OpenClaw Monitor otomatis ngecek dan ngeranking semua Reels & Video Instagram kamu berdasarkan views — biar kamu tau persis konten mana yang perform terbaik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
              >
                Masuk ke Dashboard →
              </a>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Udah running otomatis tiap hari jam 08.00 WIB ☕
            </p>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-12 bg-[#1a1f2e]">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center p-6 bg-[#0f1117] rounded-xl border border-gray-800">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-8 w-8 text-blue-400 mr-2" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {totalPostsFormatted}
                </div>
                <div className="text-gray-400 text-sm">Sudah dipantau</div>
              </div>
              <div className="text-center p-6 bg-[#0f1117] rounded-xl border border-gray-800">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="h-8 w-8 text-green-400 mr-2" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {totalViewsFormatted}
                </div>
                <div className="text-gray-400 text-sm">Views tertinggi tercatat</div>
              </div>
              <div className="text-center p-6 bg-[#0f1117] rounded-xl border border-gray-800">
                <div className="flex items-center justify-center mb-2">
                  <GitBranch className="h-8 w-8 text-purple-400 mr-2" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  {totalRunsFormatted}
                </div>
                <div className="text-gray-400 text-sm">Monitoring berjalan</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-[#0f1117]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-white">
              Kenapa Pakai OpenClaw Monitor?
            </h2>
            <p className="text-center text-gray-400 max-w-2xl mx-auto mb-12">
              Semua yang kamu butuh buat tau konten mana yang works
            </p>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-[#1a1f2e] border border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-900/30 rounded-lg">
                      <span className="text-3xl">🔍</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Scraping Otomatis</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Chromium headless jalan tiap hari, login pakai cookies Instagram kamu. Ngga ada API limit, ngga ada setup ribet.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f2e] border border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-900/30 rounded-lg">
                      <span className="text-3xl">📈</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Ranking by Views</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Semua post diurutin dari yang paling banyak ditonton. Filter by akun, tipe konten, atau rentang tanggal.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1f2e] border border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-900/30 rounded-lg">
                      <span className="text-3xl">💬</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Laporan ke Telegram</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Tiap hari kamu dapet kiriman report top post langsung ke Telegram. Ngga perlu buka dashboard buat tau hasilnya.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-16 bg-[#0f1117]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">
              Stack yang Dipakai
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Modern, scalable, dan self-hosted di VPS kamu sendiri
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {['Next.js 14', 'TypeScript', 'PostgreSQL', 'Prisma ORM', 'Playwright', 'Docker', 'Cloudflare Tunnel', 'Tailwind CSS', 'OpenClaw Platform'].map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 bg-[#1a1f2e] text-gray-300 rounded-full text-sm font-medium border border-gray-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-[#1a1f2e]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">
              Cara Kerjanya Simpel
            </h2>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Pasang Cookies Instagram</h3>
                <p className="text-gray-400 leading-relaxed">
                  Export session cookies dari browser kamu, paste ke config. Selesai. Agent langsung bisa akses Instagram.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Agent Jalan Otomatis</h3>
                <p className="text-gray-400 leading-relaxed">
                  Tiap jam 08.00 WIB, Playwright buka Instagram, scroll halaman Reels, dan kumpulin semua data views.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Lihat Hasilnya</h3>
                <p className="text-gray-400 leading-relaxed">
                  Buka dashboard atau tunggu notif Telegram. Semua post udah diranking dari yang paling viral.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Siap Pantau Konten Instagram Kamu?
            </h2>
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
              Login sekarang dan lihat konten mana yang paling banyak ditonton.
            </p>
            <a
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Mulai Sekarang →
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-800 bg-[#0f1117]">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © 2026 OpenClaw Monitor • Dibuat dengan ☕ dan Playwright • Self-hosted di VPS
          </div>
        </footer>
      </div>
    );
  }

  // Show dashboard when authenticated
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
          Dashboard Overview
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Posts"
          value={stats?.totalPosts?.toLocaleString() ?? '0'}
          subtitle="All time collected"
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Total Views"
          value={stats?.totalViews != null ? Number(stats.totalViews).toLocaleString() : '0'}
          subtitle="All time"
          icon={Eye}
          color="green"
        />
        <StatsCard
          title="Active Accounts"
          value={stats?.activeAccounts?.toString() ?? '0'}
          subtitle={`${stats?.totalAccounts ?? 0} total accounts`}
          icon={UserCheck}
          color="purple"
        />
        <StatsCard
          title="Recent Runs"
          value={stats?.recentRuns?.length?.toString() ?? '0'}
          subtitle="Last 7 days"
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-[#1e2433] border border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Views Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {stats?.recentRuns && stats.recentRuns.length > 0 ? (
              <ViewsTrendChart runs={stats.recentRuns} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No data available yet</p>
                  <p className="text-sm mt-1">Run the monitor to collect views</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1e2433] border border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
            <CardTitle className="flex items-center space-x-2 text-white">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Top Posts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {topPosts.length > 0 ? (
              <TopPostsBarChart posts={topPosts} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-900 rounded-lg border border-gray-700">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No posts yet</p>
                  <p className="text-sm mt-1">Start monitoring to see top posts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
