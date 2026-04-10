// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/icon.png" />

          <link
            rel="stylesheet"
            href="https://unpkg.com/@knadh/oat/oat.min.css"
          />
          <script src="https://unpkg.com/@knadh/oat/oat.min.js" defer></script>

          <script>
            {`(() => {
              var theme = localStorage.getItem("theme");
              if (theme) {
                document.documentElement.style.colorScheme = theme;
              }
            })()`}
          </script>

          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
