FROM nixos/nix:latest

ENV NIX_CONFIG "experimental-features = nix-command flakes"

WORKDIR /app
COPY . .

ENTRYPOINT nix develop
