'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Package,
  Warehouse,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const navigation = [
  {
    title: 'PRINCIPAL',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      {
        label: 'Calendário de entregas',
        href: '/calendario',
        icon: CalendarDays,
      },
    ],
  },
  {
    title: 'OPERAÇÃO',
    items: [
      {
        label: 'Programação de lavagem',
        href: '/lavagem',
        icon: ClipboardList,
      },
    ],
  },
  {
    title: 'GERENCIAMENTO',
    items: [
      { label: 'Usuários', href: '/usuarios', icon: Users },
      { label: 'Catálogo', href: '/catalogo', icon: Package },
      { label: 'Estoque de veículos', href: '/estoque', icon: Warehouse },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function renderNavigation() {
    return navigation.map((section) => (
      <div key={section.title}>
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[1.2px] text-gray-400">
          {section.title}
        </p>

        <div className="space-y-1">
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-[13px] transition ${
                  active
                    ? 'bg-[#151515] font-medium text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    ));
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <header className="fixed top-0 z-40 flex h-[68px] w-full items-center justify-between bg-[#151515] px-5 text-white shadow-md lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-gray-300 hover:bg-white/10 lg:hidden"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          {/* Área reservada para a logo */}
          <div className="flex h-10 w-[130px] shrink-0 items-center" />

          <div className="h-7 w-px bg-white/25" />

          <span className="text-sm font-medium tracking-tight text-gray-200">
            Portal de Entregas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-2 text-gray-300 hover:bg-white/10"
            aria-label="Notificações"
          >
            <Bell size={19} />
          </button>

          <div className="flex items-center gap-2 border-l border-white/20 pl-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-semibold text-black">
              US
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">Usuário</p>
              <p className="text-xs text-gray-400">Perfil de acesso</p>
            </div>

            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* Menu desktop */}
      <aside className="fixed bottom-0 left-0 top-[68px] z-20 hidden w-[250px] border-r border-gray-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-7">
            {renderNavigation()}
          </nav>

          <div className="border-t border-gray-100 p-5">
            <p className="text-xs text-gray-400">Grupo New</p>
            <p className="mt-1 text-[11px] text-gray-300">Portal de Entregas</p>
          </div>
        </div>
      </aside>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="absolute bottom-0 left-0 top-[68px] w-[280px] bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="space-y-7 overflow-y-auto px-4 py-7">
              {renderNavigation()}
            </nav>
          </aside>
        </div>
      )}

      <main className="min-h-screen pt-[68px] lg:pl-[250px]">{children}</main>
    </div>
  );
}
