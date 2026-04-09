{
  stdenv,
  makeWrapper,
  nodejs,
  pnpm,
  fetchPnpmDeps,
  pnpmConfigHook,
}:
stdenv.mkDerivation (finalAttrs: {
  pname = "doppelkopf";
  version = "0.0.1";

  src = ./.;

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    fetcherVersion = 3;
    hash = "sha256-ea9zCbNNuUL9DmxWAfxvHfIbMkwCv7GKe+nxLEi+vN4=";
  };

  nativeBuildInputs = [
    makeWrapper
    nodejs
    pnpm
    pnpmConfigHook
  ];

  buildPhase = ''
    runHook preBuild

    pnpm run build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/{lib,bin}

    cp -r .output $out/lib/doppelkopf
    cp -r drizzle $out/lib/

    makeWrapper ${nodejs}/bin/node $out/bin/doppelkopf \
      --add-flags "$out/lib/doppelkopf/server/index.mjs" \
      --run "cd $out/lib"

    runHook postInstall
  '';
})
