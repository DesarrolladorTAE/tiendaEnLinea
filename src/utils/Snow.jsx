// src/utils/Snow.jsx
import React, { useEffect, useRef } from "react";

const Snow = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const flakes = Array.from({ length: 140 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 2,
      d: Math.random() * 0.3 + 0.3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? -1 : 1),
      type: Math.random() < 0.4 ? "snowflake" : "circle",
    }));

    const updateSize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", updateSize);

    const drawSnowflakeShape = (f) => {
      const size = f.r * 4;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.angle);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(180, 210, 255, 0.95)";

      for (let i = 0; i < 6; i++) {
        ctx.rotate((Math.PI * 2) / 6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);

        const branch = size * 0.35;
        const y = -size * 0.6;

        ctx.moveTo(0, y);
        ctx.lineTo(-branch, y - branch * 0.4);
        ctx.moveTo(0, y);
        ctx.lineTo(branch, y - branch * 0.4);

        ctx.stroke();
      }

      ctx.restore();
    };

    const update = () => {
      flakes.forEach((f) => {
        f.y += f.d;
        f.x += Math.sin(f.y * 0.01) * 0.4;
        f.angle += f.spin;

        if (f.y > height + 20) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x < -20) f.x = width + 20;
        if (f.x > width + 20) f.x = -20;
      });
    };

    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.shadowColor = "rgba(130, 160, 210, 0.9)";
      ctx.shadowBlur = 6;

      flakes.forEach((f) => {
        if (f.type === "circle") {
          ctx.beginPath();
          ctx.fillStyle = "rgba(200, 225, 255, 0.95)";
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(150, 180, 230, 0.9)";
          drawSnowflakeShape(f);
        }
      });

      update();
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9998,
      }}
    />
  );
};

export default Snow;
