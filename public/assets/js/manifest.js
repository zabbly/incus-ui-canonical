var screenshot = window.location.origin + "/ui/assets/img/";

const manifestElement = document.getElementById("manifest");
const dynamicManifest = JSON.stringify({
  short_name: "Incus " + window.location.origin,
  name: "Incus UI - " + window.location.origin,
  icons: [
    {
      src: window.location.origin + "/ui/assets/img/app-logo.png",
      type: "image/png",
      sizes: "512x512",
    },
  ],
  id: "INCUSID-"  + window.location.origin,
  start_url: window.location.origin,
  background_color: "#E95420",
  display: "standalone",
  scope: window.location.origin,
  theme_color: "#262626",
  shortcuts: [],
  description:
    "Incus provides a unified user experience for managing containers and virtual machines.",
  screenshots: [
    {
      src: screenshot + "screenshot.png",
      type: "image/png",
      sizes: "1537x816",
      form_factor: "wide",
    },
  ],
});

manifestElement?.setAttribute(
  "href",
  "data:application/json;charset=utf-8," + encodeURIComponent(dynamicManifest),
);
