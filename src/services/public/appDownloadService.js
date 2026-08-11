// services/public/appDownloadService.js

import axios from "../../config/axios";

const BASE_URL = "/public/apps";

export const appDownloadService = {
  getLatest: (params = {}) =>
    axios.get(`${BASE_URL}/latest`, {
      params,
    }),

  getAvailable: (params = {}) =>
    axios.get(`${BASE_URL}/available`, {
      params,
    }),
};