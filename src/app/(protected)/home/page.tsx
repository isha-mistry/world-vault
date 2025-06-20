import { auth } from '@/auth';
import { Page } from '@/components/PageLayout';
import { VaultDetails } from '@/components/VaultDetails';
import { WithdrawButton } from '@/components/WithdrawButton';
import { DepositComponent } from '@/components/DepositComponent';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CustomTopBar } from '@/components/CustomTopBar';
import { Navigation } from '@/components/Navigation';
import { Marble, TopBar } from '@worldcoin/mini-apps-ui-kit-react';

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Page.Header className="p-0 bg-[var(--topbar-bg)]">
        <CustomTopBar
          endAdornment={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-[var(--agent-bg)] rounded-full border border-[var(--border)]">
                <span className="text-sm font-semibold text-[var(--foreground)] capitalize">
                  {session?.user.username}
                </span>
              </div>

              <div className="flex items-center">
                <ThemeToggle />
              </div>
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="bg-gradient-to-br from-[var(--background)] via-[var(--accent-light)] to-[var(--background)] relative">
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-4 w-72 h-72 bg-[var(--success)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[var(--warning)] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-start gap-6 sm:gap-8 mb-20 sm:mb-16 w-full pb-24 pt-4 sm:pt-8">
          <VaultDetails />
          <WithdrawButton />
          <DepositComponent />
        </div>
      </Page.Main>
      <Page.Footer className="fixed bottom-0 left-0 right-0 z-20 bg-transparent">
        <Navigation />
      </Page.Footer>
    </>
  );
}
