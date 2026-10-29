export const sendToBridge = async (payload) => {
    if (window.AndroidPrintBridge?.print) {
      const result = await window.AndroidPrintBridge.print(JSON.stringify(payload));
      if (result !== true && result !== "true") throw new Error(result || "No se pudo imprimir desde Android.");
      return true;
    }
    if (window.flutter_inappwebview?.callHandler) {
      const result = await window.flutter_inappwebview.callHandler("printTicket", { payload });
      if (!result?.ok) throw new Error(result?.message || "No se pudo imprimir desde la app.");
      return true;
    }
    if (typeof window.sendPrintPayloadToWindows === "function") {
      const result = await window.sendPrintPayloadToWindows(payload);
      if (result === false || result?.ok === false) throw new Error(result?.message || "No se pudo enviar el ticket a Windows.");
      return true;
    }

    if (window.chrome?.webview?.postMessage) {
      window.chrome.webview.postMessage(JSON.stringify(payload));
      return true;
    }

    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      return true;
    }

    if (window.webkit?.messageHandlers?.printPayload?.postMessage) {
      window.webkit.messageHandlers.printPayload.postMessage(payload);
      return true;
    }

    return false;
  };
