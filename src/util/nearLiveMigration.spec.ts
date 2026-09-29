import type { LxdInstance } from "types/instance";
import { isNearLiveMigration } from "./nearLiveMigration";

const instance = (
  type: string,
  status: string,
  location = "member1",
): LxdInstance => ({ type, status, location }) as unknown as LxdInstance;

describe("isNearLiveMigration", () => {
  it("is used for a running container moving to another cluster member", () => {
    expect(
      isNearLiveMigration(instance("container", "Running"), true, "member2"),
    ).toBe(true);
  });

  it("is not used when the server lacks instance_refresh_migration", () => {
    expect(
      isNearLiveMigration(instance("container", "Running"), false, "member2"),
    ).toBe(false);
  });

  it("is not used for a running virtual machine, which migrates live", () => {
    expect(
      isNearLiveMigration(
        instance("virtual-machine", "Running"),
        true,
        "member2",
      ),
    ).toBe(false);
  });

  it("is not used for a stopped container", () => {
    expect(
      isNearLiveMigration(instance("container", "Stopped"), true, "member2"),
    ).toBe(false);
  });

  it("is not used without a target member or for the current member", () => {
    const running = instance("container", "Running");
    expect(isNearLiveMigration(running, true)).toBe(false);
    expect(isNearLiveMigration(running, true, "")).toBe(false);
    expect(isNearLiveMigration(running, true, "none")).toBe(false);
    expect(isNearLiveMigration(running, true, "member1")).toBe(false);
  });

  it("is not used when the storage pool or project changes too", () => {
    const running = instance("container", "Running");
    expect(isNearLiveMigration(running, true, "member2", "pool2")).toBe(false);
    expect(isNearLiveMigration(running, true, "member2", "", "project2")).toBe(
      false,
    );
  });
});
