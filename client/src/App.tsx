import { useEffect, useState } from "react";
import type { ReportDetail } from "../../shared/report.ts";
import { Background, Header } from "./components/ui.tsx";
import { HomeView } from "./views/HomeView.tsx";
import { ReportView } from "./views/ReportView.tsx";

/** Two screens, switched by the URL hash so that reload and Back work: #/ and #/report/<id>. */
type Route = { name: "home" } | { name: "report"; id: string };

function parseHash(): Route {
  const m = window.location.hash.match(/^#\/report\/([\w-]+)$/);
  return m?.[1] ? { name: "report", id: m[1] } : { name: "home" };
}

export function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  // A report just produced by the analysis is passed directly, so it shows without a refetch.
  const [fresh, setFresh] = useState<ReportDetail | null>(null);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goHome = () => {
    window.location.hash = "#/";
  };
  const openReport = (id: string, detail?: ReportDetail) => {
    setFresh(detail ?? null);
    window.location.hash = `#/report/${id}`;
  };

  return (
    <>
      <Background />
      <div className="shell">
        <Header onHome={goHome} />
        <main className="main">
          {route.name === "home" ? (
            <HomeView onOpenReport={openReport} />
          ) : (
            <ReportView id={route.id} initial={fresh?.id === route.id ? fresh : null} onBack={goHome} />
          )}
        </main>
        <footer className="footer">
          Отчёты подготовлены ИИ и ожидают вашей проверки. Цитаты сверяются с расшифровкой автоматически.
        </footer>
      </div>
    </>
  );
}
