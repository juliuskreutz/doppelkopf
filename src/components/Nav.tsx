import { createSignal, onMount, Show } from "solid-js";

function iconDark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      role="img"
      aria-label="Dark mode"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );
}

function iconLight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      role="img"
      aria-label="Light mode"
    >
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  );
}

export default function Nav() {
  const [theme, setTheme] = createSignal<string | undefined>(undefined);

  onMount(() => {
    const t = localStorage.getItem("theme");
    if (t) {
      setTheme(t);
    } else {
      setTheme("dark");
    }
  });

  function toggleTheme() {
    let t: string;
    if (theme() === "dark") {
      t = "light";
    } else {
      t = "dark";
    }

    localStorage.setItem("theme", t);
    document.documentElement.style.colorScheme = t;
    setTheme(t);
  }

  return (
    <nav data-topnav>
      <div class="flex items-center w-100">
        <a href="/" class="flex items-center">
          <img src="/icon.png" alt="icon" width="30px" />
          <b>Doppelkopf</b>
        </a>
      </div>
      <Show when={theme()}>
        <button
          type="button"
          class="ghost flex items-center"
          onclick={toggleTheme}
        >
          {theme() === "dark" ? iconLight() : iconDark()}
        </button>
      </Show>
      <div>
        <a href="/sessions" type="button">
          Sessions
        </a>
      </div>
    </nav>
  );
}
