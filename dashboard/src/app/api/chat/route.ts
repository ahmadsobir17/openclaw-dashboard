import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/getServerSession';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { reply: 'Mohon kirim pesan yang valid.' },
        { status: 400 }
      );
    }

    const msg = message.toLowerCase().trim();

    const isViralIntent = ['viral', 'views', 'terbanyak', 'top', 'ranking', 'konten'].some(k => msg.includes(k));
    const isTriggerIntent = ['jalankan', 'trigger', 'mulai', 'run', 'start', 'monitoring sekarang'].some(k => msg.includes(k));
    const isStatusIntent = ['status', 'terakhir', 'history', 'riwayat', 'kapan'].some(k => msg.includes(k));
    const isAccountIntent = ['akun', 'account', 'dipantau', 'pantau'].some(k => msg.includes(k));
    const isCookieIntent = ['cookie', 'expired', 'login'].some(k => msg.includes(k));

    if (isViralIntent) {
      // Get top posts
      const posts = await prisma.post.findMany({
        orderBy: { views: 'desc' },
        take: 10,
        include: { account: true },
      });

      if (posts.length === 0) {
        return NextResponse.json({
          reply: 'Belum ada data posts. Jalankan monitoring terlebih dahulu.',
        });
      }

      const lines = posts.map((post, idx) => {
        const viewCount = Number(post.views).toLocaleString('id-ID');
        const date = new Date(post.postDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        return `${idx + 1}. @${post.username} — ${viewCount} views (${post.mediaType}) • ${date}`;
      });

      return NextResponse.json({
        reply: `📊 *Top 10 Konten Viral:*\n\n${lines.join('\n')}`,
        data: { posts },
      });
    } else if (isTriggerIntent) {
      // Trigger monitor by calling agent's trigger endpoint directly
      const agentUrl = process.env.AGENT_URL || 'http://localhost:4000';
      try {
        const triggerRes = await fetch(`${agentUrl.replace(/\/$/, '')}/trigger`, {
          method: 'POST',
        });

        const data = await triggerRes.json();

        if (triggerRes.ok && data.triggered) {
          return NextResponse.json({
            reply: `✅ *Monitoring dimulai!*\n\nAgent sedang berjalan di latar belakang.\nSilakan cek halaman Runs untuk melihat progress.`,
          });
        } else {
          return NextResponse.json({
            reply: `❌ *Gagal memicu monitoring.*\n\n${data.error || 'Unknown error'}`,
          });
        }
      } catch (error: any) {
        return NextResponse.json({
          reply: `❌ *Tidak dapat terhubung ke agent.*\n\nError: ${error.message}`,
        });
      }
    } else if (isStatusIntent) {
      // Get latest monitor run
      const lastRun = await prisma.monitorRun.findFirst({
        orderBy: { runAt: 'desc' },
      });

      if (!lastRun) {
        return NextResponse.json({
          reply: 'Belum ada history monitoring.',
        });
      }

      const runDate = new Date(lastRun.runAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return NextResponse.json({
        reply: `📅 *Monitoring Terakhir:*\n\n📅 Waktu: ${runDate} WIB\n📊 POSTS: ${lastRun.postsFetched}\n⏱️ Duration: ${lastRun.durationMs} ms\n📈 Top Views: ${Number(lastRun.topViews || 0).toLocaleString('id-ID')}\n✅ Status: ${lastRun.status}`,
        data: { run: lastRun },
      });
    } else if (isAccountIntent) {
      // Get active accounts
      const accounts = await prisma.account.findMany({
        where: { isActive: true },
        orderBy: { username: 'asc' },
      });

      if (accounts.length === 0) {
        return NextResponse.json({
          reply: 'Belum ada akun yang dipantau. Tambahkan akun di halaman Accounts.',
        });
      }

      const accountList = accounts.map(a => `@${a.username}`).join(', ');
      return NextResponse.json({
        reply: `👥 *Akun Aktif (${accounts.length}):*\n\n${accountList}`,
        data: { accounts },
      });
    } else if (isCookieIntent) {
      // Check cookie status via API
      const baseUrl = process.env.NEXT_URL || 'http://localhost:3000';
      const cookieRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/cookies/status`, {
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (cookieRes.ok) {
        const data = await cookieRes.json();
        const status = data.cookiesValidated
          ? `✅ Cookie status: validated.\n${data.message}`
          : `⚠️ Cookie tidak valid.\n${data.message}`;
        return NextResponse.json({
          reply: status,
        });
      } else {
        return NextResponse.json({
          reply: '❌ Tidak dapat memeriksa status cookie.',
        });
      }
    } else {
      // Default fallback
      return NextResponse.json({
        reply: "Maaf, aku belum ngerti maksudnya 😅\n\nCoba tanya:\n• Konten viral minggu ini\n• Status monitoring terakhir\n• Akun yang dipantau\n• Jalankan monitoring sekarang\n• Status cookie",
      });
    }

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { reply: 'Terjadi kesalahan. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}