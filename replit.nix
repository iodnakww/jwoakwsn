{ pkgs }: {
  deps = [
    pkgs.nodejs
    pkgs.libuuid
    pkgs.zlib
    pkgs.freetype
    pkgs.fontconfig
    pkgs.cairo
  ];
}