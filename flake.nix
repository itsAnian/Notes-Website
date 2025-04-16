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
                devShells.default = pkgs.mkShell {
                buildInputs = [
                pkgs.nodejs
                pkgs.nodePackages.npm
                pkgs.ejs
                pkgs.sqlite
                ];

                shellHook = ''
                echo "Node.js environment ready!"
                echo "Node.js version: $(node --version)"
                echo "npm version: $(npm --version)"
                npm install express
                npm install sqlite3
                npm install express-session
                '';
                };

                packages.default = pkgs.buildNpmPackage {
                    pname = "notes-nodejs";
                    version = "1.0.0";
                    src = ./.;

                    npmDepsHash = "sha256-9nRBTGCP6WzjJWlxwUebXFOkDw3kJQt+tQguTVNzz1Q=" ;

                        installPhase = ''
                        mkdir -p $out/bin
                        cp -r ./* $out/app
                        echo '#!/bin/sh' > $out/bin/notes-nodejs
                        echo 'node $out/app/index.js' >> $out/bin/notes-nodejs
                        chmod +x $out/bin/notes-nodejs
                        '';
                };

                apps.default = {
                    type = "app";
                    program = "${self.packages.${system}.default}/bin/notes-nodejs";
                };
                });
}
