'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      {!isLoginPage && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
      <div className={cn("flex-1 flex flex-col", !isLoginPage && "md:ml-64")}>
        {!isLoginPage && <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
        <main className="flex-1 bg-[#0f1117] p-6">{children}</main>
      </div>
    </div>
  )
}
