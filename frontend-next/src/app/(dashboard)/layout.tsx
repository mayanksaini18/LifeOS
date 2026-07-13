import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { HydrateUser } from "@/components/providers/hydrate-user";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (user && !user.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <HydrateUser user={user} />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-6 md:px-10 py-8">{children}</main>
      </div>
    </SidebarProvider>
  );
}
