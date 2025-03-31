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

                packages.default = pkgs.stdenv.mkDerivation {
                    name = "my-nodejs-project";
                    src = ./.;
                    buildInputs = [ pkgs.nodejs pkgs.ejs ];
                    buildPhase = ''
                        npm install express
                        npm install sqlite3
                        npm install express-session
                        '';
                    installPhase = ''
                        npm start
                        '';
                };

                apps.default = {
                    type = "app";
                    program = "npm start";
                };
                });
}
