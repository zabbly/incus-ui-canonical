import forge from "node-forge";

self.onmessage = (event: MessageEvent<string>) => {
  const result = generateCert(event.data);
  self.postMessage(result);
};

const getRandomBytes = (n: number) => {
  const crypto = self.crypto;
  const QUOTA = 65536;
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i += QUOTA) {
    crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
  }
  return a;
};

export const sanitizeOrgName = (orgName: string) => {
  return orgName.replace(/[^a-zA-Z0-9 '()+,-./:=?]/g, "");
};

const details = [
  {
    name: "organizationName",
    value: sanitizeOrgName(`Incus UI ${location.hostname} (Browser Generated)`),
  },
];

const generateCert = (password: string) => {
  const validDays = 1000;

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;

  // Generate a positive serial number
  let serialBytes = getRandomBytes(16);
  if (serialBytes[0] >= 128) {
    serialBytes[0] &= 0x7F; // Ensure the first bit is not set (make it positive)
  }
  const serialHex = Array.from(serialBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  cert.serialNumber = serialHex;

  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * validDays,
  );
  cert.setSubject(details);
  cert.setIssuer(details);
  cert.sign(keys.privateKey);

  const crt = forge.pki.certificateToPem(cert);

  const asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password, {
    algorithm: "3des", // Required for macOS Keychain support
    generateLocalKeyId: true,
    friendlyName: "Incus-UI",
  });
  const der = forge.asn1.toDer(asn1).getBytes();
  const pfx = forge.util.encode64(der);

  return {
    crt: crt,
    pfx: pfx,
  };
};

