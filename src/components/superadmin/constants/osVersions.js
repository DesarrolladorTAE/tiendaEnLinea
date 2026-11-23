export const OS_VERSIONS = {
  android: [
    { api: 36, value: 36, label: "Android 16", version: "16" },
    { api: 35, value: 35, label: "Android 15", version: "15" },
    { api: 34, value: 34, label: "Android 14", version: "14" },
    { api: 33, value: 33, label: "Android 13", version: "13" },
    { api: 32, value: 32, label: "Android 12L", version: "12.1" },
    { api: 31, value: 31, label: "Android 12", version: "12" },
    { api: 30, value: 30, label: "Android 11", version: "11" },
    { api: 29, value: 29, label: "Android 10", version: "10" },
    { api: 28, value: 28, label: "Android 9 Pie", version: "9" },
    { api: 27, value: 27, label: "Android 8.1 Oreo", version: "8.1" },
    { api: 26, value: 26, label: "Android 8.0 Oreo", version: "8.0" },
    { api: 25, value: 25, label: "Android 7.1 Nougat", version: "7.1" },
    { api: 24, value: 24, label: "Android 7.0 Nougat", version: "7.0" },
    { api: 23, value: 23, label: "Android 6 Marshmallow", version: "6.0" },
    { api: 22, value: 22, label: "Android 5.1 Lollipop", version: "5.1" },
    { api: 21, value: 21, label: "Android 5.0 Lollipop", version: "5.0" },
  ],

  ios: [
    { value: "26", label: "iOS 26", version: "26" },
    { value: "18", label: "iOS 18", version: "18" },
    { value: "17", label: "iOS 17", version: "17" },
    { value: "16", label: "iOS 16", version: "16" },
    { value: "15", label: "iOS 15", version: "15" },
    { value: "14", label: "iOS 14", version: "14" },
    { value: "13", label: "iOS 13", version: "13" },
    { value: "12", label: "iOS 12", version: "12" },
  ],

  windows: [
    { value: "11", label: "Windows 11", version: "11" },
    { value: "10", label: "Windows 10", version: "10" },
    { value: "8.1", label: "Windows 8.1", version: "8.1" },
    { value: "8", label: "Windows 8", version: "8" },
    { value: "7", label: "Windows 7", version: "7" },
  ],

  macos: [
    { value: "26", label: "macOS Tahoe", version: "26" },
    { value: "15", label: "macOS Sequoia", version: "15" },
    { value: "14", label: "macOS Sonoma", version: "14" },
    { value: "13", label: "macOS Ventura", version: "13" },
    { value: "12", label: "macOS Monterey", version: "12" },
    { value: "11", label: "macOS Big Sur", version: "11" },
    { value: "10.15", label: "macOS Catalina", version: "10.15" },
  ],
};

export const getOsVersions = (platform) => {
  return OS_VERSIONS[platform] || [];
};

export const getOsVersionLabel = (platform, value) => {
  const list = getOsVersions(platform);
  const found = list.find((item) => String(item.value) === String(value));
  return found?.label || "";
};