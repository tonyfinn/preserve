{
  description = "tonyfinn.com home page";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }: let
  in
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in rec {
      packages.default = let
        packageJson = pkgs.lib.importJSON ./preserve-ui/package.json;
      in
      pkgs.stdenv.mkDerivation {
        pname = "preserve";
        version = packageJson.version;
        src = ./.;

        nativeBuildInputs = [
          pkgs.nodejs_18
          pkgs.python310
        ];

        buildPhase = ''
          cd preserve-ui && npm ci && npm build:prod
        '';
        installPhase = ''
          mv preserve-ui/dist $out
        '';
      };
      apps.default = let
        serv = pkgs.writeShellApplication {
          name = "localserve";
          runtimeInputs = [pkgs.caddy];
          text = ''
            caddy file-server --listen :8090 --root ${self.packages.${system}.default}
          '';
        };
      in {
        type = "app";
        program = "${serv}/bin/localserve";
      };

      formatter = pkgs.alejandra;
    })
    // {
      nixosModules.default = {
        config,
        lib,
        pkgs,
        ...
      }: let
        cfg = config.preserve.ui;
      in {
        config = {
          services.nginx.virtualHosts.${cfg.domain} = {
            addSSL = cfg.useHttps;
            enableACME = false;
            root = self.packages.${pkgs.system}.default;
          };
        };
        options.preserve.ui = {
          domain = lib.mkOption {
            type = lib.types.str;
            default = "preserveplayer.com";
            example = "preserveplayer.com";
            description = ''
              Domain name to host the blog at
            '';
          };
          useHttps = lib.mkOption {
            type = lib.types.bool;
            default = true;
            description = ''
              Whether to enable https or not.
            '';
          };
        };
      };
    };
}
