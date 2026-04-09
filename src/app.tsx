import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Doppelkopf</Title>
          <nav data-topnav>
            <div class="flex items-center w-100">
              <a href="/">
                <b>Doppelkopf</b>
              </a>
            </div>
            <div>
              <a href="/sessions" type="button">
                Sessions
              </a>
            </div>
          </nav>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
