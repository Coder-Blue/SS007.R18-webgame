{
  description = "Doc Quyen Kinh Te / The Rice Monopoly - isometric political economy tycoon";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs @ {flake-parts, ...}:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      perSystem = {
        pkgs,
        system,
        ...
      }: let
        lib = pkgs.lib;
        isLinux = pkgs.stdenv.hostPlatform.isLinux;
        pkgsMusl = if isLinux then pkgs.pkgsMusl else null;

        browserLibs = with pkgs; [
          alsa-lib
          atk
          cairo
          cups
          dbus
          expat
          fontconfig
          freetype
          gdk-pixbuf
          glib
          gtk3
          libdrm
          libgbm
          libX11
          libXcomposite
          libXcursor
          libXdamage
          libXext
          libXfixes
          libXi
          libXrandr
          libxkbcommon
          mesa
          nspr
          nss
          pango
          systemd
          udev
        ];

        mkDevShell = packagePkgs: let
          isMusl = packagePkgs.stdenv.hostPlatform.isMusl;
        in
          packagePkgs.mkShell {
            packages = with packagePkgs; [
              nodejs
              git
              typescript
              playwright-driver
            ];

            # The lean default shell keeps `direnv allow` fast. oxlint and
            # oxfmt come from the pinned pnpm devDependencies, which match the
            # project config instead of the older nixpkgs binaries. Playwright
            # uses the host browser cache; `.#playwright` adds Nix Chromium.
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";

            shellHook = ''
              export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
              # Nix's packaged pnpm crashes on Chimera's loader; npm exec gives
              # the exact package-manager version from package.json.
              mkdir -p "$PWD/.direnv/bin"
              cat > "$PWD/.direnv/bin/pnpm" <<'SHIM'
#!/usr/bin/env bash
exec npm exec --yes pnpm@12.4.2 -- "$@"
SHIM
              chmod +x "$PWD/.direnv/bin/pnpm"
              export PATH="$PWD/.direnv/bin:$PATH"
              echo "Doc Quyen Kinh Te dev shell (${packagePkgs.stdenv.hostPlatform.config}${lib.optionalString isMusl ", musl host"}); pnpm is ready"
            '';
          };
      in {
        formatter = pkgs.alejandra;

        devShells =
          {
            default = mkDevShell pkgs;
            playwright = pkgs.mkShell {
              packages = with pkgs; [
                nodejs
                pnpm
                git
                chromium
                playwright-driver
              ] ++ browserLibs;
              PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
              PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
              PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
              LD_LIBRARY_PATH = lib.makeLibraryPath browserLibs;
            };
          }
          // lib.optionalAttrs isLinux {
            # Nix glibc binaries carry their own loader and run on Chimera and
            # other musl hosts. This keeps `direnv allow` instant instead of
            # compiling a full pkgsMusl stdenv. Use `.#musl-full` only when a
            # truly musl-linked toolchain is required.
            musl = mkDevShell pkgs;
            musl-full = mkDevShell pkgsMusl;
          };

        checks.format =
          pkgs.runCommand "check-format" {
            nativeBuildInputs = [pkgs.alejandra];
          } ''
            alejandra --check ${./flake.nix}
            touch $out
          '';
      };
    };
}
