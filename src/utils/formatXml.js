export const formatXml = (rawXml) => {
  try {
    if (!rawXml) return "";
    const PADDING = "  ";
    const reg = /(>)(<)(\/*)/g;
    let pad = 0;

    const xmlWithLines = rawXml.replace(reg, "$1\r\n$2$3");

    return xmlWithLines
      .split("\r\n")
      .map((node) => {
        let indent = 0;

        if (node.match(/.+<\/\w[^>]*>$/)) indent = 0;
        else if (node.match(/^<\/\w/)) {
          if (pad !== 0) pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) indent = 1;

        const line = PADDING.repeat(Math.max(0, pad)) + node;
        pad += indent;
        return line;
      })
      .join("\r\n");
  } catch (e) {
    return rawXml || "";
  }
};
