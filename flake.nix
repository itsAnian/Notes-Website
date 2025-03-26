{
  description = "A development environment for Node.js";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        # Development shell
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs
            pkgs.nodePackages.npm
            pkgs.ejs
            pkgs.docker
            # Optionally, add yarn if you prefer it over npm
            # pkgs.yarn
          ];

          shellHook = ''
            echo "Node.js environment ready!"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            npm install express
          '';
        };

        # Default package (buildable with `nix build`)
        packages.default = pkgs.stdenv.mkDerivation {
          name = "my-nodejs-project";
          src = ./.;
          buildInputs = [ pkgs.nodejs pkgs.ejs ];
          buildPhase = ''
            npm install express
          '';
          installPhase = ''
            npm start
          '';
        };

        # Default app (runnable with `nix run`)
        apps.default = {
          type = "app";
          program = "npm start";
        };
      });
}
