import { useEffect } from "react";

export default function useScrollReveal() {
  useEffect(() => {
    const options = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
      });
    }, options);

    const els = document.querySelectorAll(".animate-on-scroll");
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
