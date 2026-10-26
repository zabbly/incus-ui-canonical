import type { Page } from "@playwright/test";
import { visitProfile } from "./profile";

export const attachVolume = async (
  page: Page,
  volume: string,
  path: string,
) => {
  await page.getByRole("button", { name: "Attach disk device" }).click();
  await page.getByRole("button", { name: "Attach custom volume" }).click();
  await page.getByRole("button", { name: "Create volume" }).click();
  await page.getByPlaceholder("Enter name").fill(volume);
  await page.getByRole("button", { name: "Create volume" }).click();
  await page.getByPlaceholder("Enter full path (e.g. /data)").last().fill(path);
};

export const attachHostPath = async (
  page: Page,
  source: string,
  path: string,
) => {
  await page.getByRole("button", { name: "Attach disk device" }).click();
  await page.getByRole("button", { name: "Mount host path" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Choose disk type / Mount host",
  });
  await dialog.getByLabel("Host path", { exact: true }).fill(source);
  await dialog.getByLabel("Mount point", { exact: true }).fill(path);
  await dialog.getByRole("button", { name: "Attach", exact: true }).click();
};

export const detachDiskDevice = async (page: Page, volumeDevice: string) => {
  await page
    .getByRole("row", { name: volumeDevice })
    .getByTitle("Detach")
    .click();
  await page
    .getByLabel("Confirm disk detachment")
    .getByRole("button", { name: "Detach" })
    .click();
};

export const visitProfileGPUDevices = async (page: Page, profile: string) => {
  await visitProfile(page, profile);
  await page.getByTestId("tab-link-Configuration").click();
  await page.getByText("GPU", { exact: true }).click();
};

export const visitProfileOtherDevices = async (page: Page, profile: string) => {
  await visitProfile(page, profile);
  await page.getByTestId("tab-link-Configuration").click();
  await page.getByText("Other", { exact: true }).click();
};

// Reads the config of the custom volume behind an instance disk device
export const getAttachedVolumeConfig = async (
  page: Page,
  instance: string,
  device: string,
  project = "default",
): Promise<Record<string, string>> => {
  const instanceResponse = await page.request.get(
    `/1.0/instances/${instance}?project=${project}`,
  );
  const instanceData = (await instanceResponse.json()) as {
    metadata: { devices: Record<string, { pool: string; source: string }> };
  };
  const { pool, source } = instanceData.metadata.devices[device];

  const volumeResponse = await page.request.get(
    `/1.0/storage-pools/${pool}/volumes/custom/${source}?project=${project}`,
  );
  const volumeData = (await volumeResponse.json()) as {
    metadata: { config: Record<string, string> };
  };
  return volumeData.metadata.config;
};
