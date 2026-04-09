{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    devenv.url = "github:cachix/devenv";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    inputs@{ self, ... }:
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = inputs.nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = inputs.devenv.lib.mkShell {
          inherit inputs pkgs;

          modules = [
            (
              { pkgs, ... }:
              {
                languages.javascript = {
                  enable = true;
                  pnpm = {
                    enable = true;
                    install.enable = true;
                  };
                };

                packages = with pkgs; [
                  biome
                  sqlite
                ];
              }
            )
          ];
        };

        packages = rec {
          default = pkgs.callPackage ./package.nix { };
          doppelkopf = default;
        };
      }
    )
    // {
      nixosModules.doppelkopf =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          cfg = config.services.doppelkopf;
          doppelkopf = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
        in
        {
          options.services.doppelkopf = {
            enable = lib.mkEnableOption "doppelkopf";

            databaseUrl = lib.mkOption {
              type = lib.types.str;
            };

            port = lib.mkOption {
              type = lib.types.int;
              default = 3000;
            };
          };

          config = lib.mkIf cfg.enable {
            systemd.services.doppelkopf = {
              wantedBy = [ "multi-user.target" ];
              environment = {
                DATABASE_URL = cfg.databaseUrl;
                PORT = toString cfg.port;
              };
              serviceConfig = {
                Restart = "always";
                ExecStart = "${doppelkopf}/bin/doppelkopf";
              };
            };
          };
        };
    };
}
