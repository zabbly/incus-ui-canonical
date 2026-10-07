import {
  getImageServerHost,
  inferOciImageReference,
  parseImageServers,
  serializeImageServers,
  type ImageServer,
} from "util/imageServers";

describe("image server configuration", () => {
  it("preserves OCI and simple streams protocols", () => {
    const servers: ImageServer[] = [
      {
        name: "docker",
        url: "https://docker.io",
        protocol: "oci",
      },
      {
        name: "images",
        url: "https://images.linuxcontainers.org",
        protocol: "simplestreams",
      },
    ];

    expect(parseImageServers(serializeImageServers(servers))).toEqual(servers);
  });

  it("defaults legacy entries to simple streams", () => {
    expect(
      parseImageServers(
        JSON.stringify([
          {
            name: "legacy",
            url: "https://images.example.com",
          },
        ]),
      ),
    ).toEqual([
      {
        name: "legacy",
        url: "https://images.example.com",
        protocol: "simplestreams",
      },
    ]);
  });

  it("infers an OCI reference from instance image metadata", () => {
    expect(
      inferOciImageReference({
        "image.description": "ghcr.io/linuxserver/calibre-web (OCI)",
        "image.id": "linuxserver/calibre-web",
        "image.type": "oci",
      }),
    ).toEqual({
      alias: "linuxserver/calibre-web:latest",
      server: "ghcr.io",
    });
  });

  it("uses an OCI image version when available", () => {
    expect(
      inferOciImageReference({
        "image.description": "https://ghcr.io/linuxserver/calibre-web (OCI)",
        "image.id": "linuxserver/calibre-web",
        "image.type": "OCI",
        "image.version": "2025.03.31",
      }),
    ).toEqual({
      alias: "linuxserver/calibre-web:2025.03.31",
      server: "ghcr.io",
    });
  });

  it("preserves a tag supplied in the OCI description", () => {
    expect(
      inferOciImageReference({
        "image.description": "ghcr.io/linuxserver/calibre-web:nightly (OCI)",
        "image.id": "linuxserver/calibre-web",
        "image.type": "oci",
      }),
    ).toEqual({
      alias: "linuxserver/calibre-web:nightly",
      server: "ghcr.io",
    });
  });

  it("normalizes image server URLs to their host", () => {
    expect(getImageServerHost("https://GHCR.io/v2/")).toBe("ghcr.io");
    expect(getImageServerHost("ghcr.io")).toBe("ghcr.io");
  });
});
