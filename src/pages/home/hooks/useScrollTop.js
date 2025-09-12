import { useEffect, useState } from "react";

export default function useScrollTop(threshold = 300) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.pageYOffset > threshold);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return show;
}
