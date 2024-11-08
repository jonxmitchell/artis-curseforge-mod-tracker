"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Popover, PopoverTrigger, PopoverContent, Tooltip, Tabs, Tab, Divider } from "@nextui-org/react";
import { Paintbrush, Copy, Check, History, Palette, Grid, Star } from "lucide-react";

const DISCORD_COLORS = [
  { name: "Blurple", hex: "#5865F2" },
  { name: "Green", hex: "#57F287" },
  { name: "Yellow", hex: "#FEE75C" },
  { name: "Fuchsia", hex: "#EB459E" },
  { name: "Red", hex: "#ED4245" },
  { name: "Navy", hex: "#404EED" },
  { name: "Blue", hex: "#3498DB" },
  { name: "Orange", hex: "#E67E22" },
  { name: "Purple", hex: "#9B59B6" },
  { name: "Magenta", hex: "#E91E63" },
  { name: "Gray", hex: "#95A5A6" },
  { name: "White", hex: "#FFFFFF" },
];

const MATERIAL_COLORS = [
  { name: "Red", hex: "#F44336" },
  { name: "Pink", hex: "#E91E63" },
  { name: "Purple", hex: "#9C27B0" },
  { name: "Deep Purple", hex: "#673AB7" },
  { name: "Indigo", hex: "#3F51B5" },
  { name: "Blue", hex: "#2196F3" },
  { name: "Light Blue", hex: "#03A9F4" },
  { name: "Cyan", hex: "#00BCD4" },
  { name: "Teal", hex: "#009688" },
  { name: "Green", hex: "#4CAF50" },
  { name: "Light Green", hex: "#8BC34A" },
  { name: "Lime", hex: "#CDDC39" },
  { name: "Yellow", hex: "#FFEB3B" },
  { name: "Amber", hex: "#FFC107" },
  { name: "Orange", hex: "#FF9800" },
  { name: "Deep Orange", hex: "#FF5722" },
];

const TAILWIND_COLORS = [
  { name: "Slate", hex: "#64748b" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Zinc", hex: "#71717a" },
  { name: "Neutral", hex: "#737373" },
  { name: "Stone", hex: "#78716c" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
];

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r, g, b) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const rgbToHsv = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = max === 0 ? 0 : diff / max;
  let v = max;

  if (diff !== 0) {
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h, s, v) => {
  h /= 360;
  s /= 100;
  v /= 100;

  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const ColorPreview = ({ color, name }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="w-full h-8 rounded-lg shadow-inner" style={{ backgroundColor: color }} />
    <span className="text-xs text-default-600">{name}</span>
  </div>
);

const ColorGrid = ({ colors, onSelect, selectedColor }) => (
  <div className="grid grid-cols-6 gap-2">
    {colors.map((colorOption) => (
      <Tooltip key={colorOption.hex} content={colorOption.name} delay={0} closeDelay={0}>
        <Button
          isIconOnly
          className="w-8 h-8 min-w-unit-8 min-h-unit-8 p-0 rounded-lg transition-transform hover:scale-110"
          style={{
            backgroundColor: colorOption.hex,
            border: selectedColor === colorOption.hex ? "2px solid #ffffff50" : "2px solid transparent",
          }}
          onClick={() => onSelect(colorOption.hex)}
        >
          {selectedColor === colorOption.hex && <Check size={14} className={parseInt(colorOption.hex.slice(1), 16) > 0xffffff / 2 ? "text-black" : "text-white"} />}
        </Button>
      </Tooltip>
    ))}
  </div>
);

const ColorHistory = ({ history, onSelect, selectedColor }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-default-600">Recent Colors</p>
    <div className="grid grid-cols-8 gap-1">
      {history.map((color, index) => (
        <Tooltip key={`${color}-${index}`} content={color}>
          <Button
            isIconOnly
            className="w-6 h-6 min-w-unit-6 min-h-unit-6 p-0 rounded transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              border: selectedColor === color ? "2px solid #ffffff50" : "2px solid transparent",
            }}
            onClick={() => onSelect(color)}
          />
        </Tooltip>
      ))}
    </div>
  </div>
);

const CustomColorPicker = ({ color, onChange }) => {
  const [isDraggingSaturation, setIsDraggingSaturation] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const saturationRef = useRef(null);
  const hueRef = useRef(null);

  const rgb = hexToRgb(color);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  const handleHueChange = (e) => {
    if (!hueRef.current) return;

    const rect = hueRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const hue = (x / rect.width) * 360;

    const newRgb = hsvToRgb(hue, hsv.s, hsv.v);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleSaturationValueChange = (e) => {
    if (!saturationRef.current) return;

    const rect = saturationRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    const saturation = (x / rect.width) * 100;
    const value = 100 - (y / rect.height) * 100;

    const newRgb = hsvToRgb(hsv.h, saturation, value);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingSaturation) {
        handleSaturationValueChange(e);
      } else if (isDraggingHue) {
        handleHueChange(e);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSaturation(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSaturation || isDraggingHue) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSaturation, isDraggingHue]);

  return (
    <div className="space-y-4">
      {/* Saturation-Value box */}
      <div
        ref={saturationRef}
        className="w-full h-[200px] rounded-lg relative cursor-crosshair"
        style={{
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          backgroundImage: `
            linear-gradient(to right, #fff 0%, transparent 100%),
            linear-gradient(to bottom, transparent 0%, #000 100%)
          `,
        }}
        onMouseDown={(e) => {
          setIsDraggingSaturation(true);
          handleSaturationValueChange(e);
        }}
      >
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full shadow-md"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="w-full h-4 rounded-lg cursor-pointer relative"
        style={{
          background: `linear-gradient(to right, 
            #ff0000 0%, #ffff00 17%, #00ff00 33%, 
            #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%
          )`,
        }}
        onMouseDown={(e) => {
          setIsDraggingHue(true);
          handleHueChange(e);
        }}
      >
        <div
          className="absolute w-4 h-4 -translate-x-1/2 top-0 border-2 border-white rounded-full shadow-md"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-default-500">
        <div>Hue: {Math.round(hsv.h)}°</div>
        <div>Saturation: {Math.round(hsv.s)}%</div>
        <div>Value: {Math.round(hsv.v)}%</div>
      </div>
    </div>
  );
};

export default function ColorPicker({ color, onChange }) {
  const [hexColor, setHexColor] = useState(`#${color.toString(16).padStart(6, "0")}`);
  const [colorHistory, setColorHistory] = useState(() => {
    const saved = localStorage.getItem("colorPickerHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [copied, setCopied] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (!isPopoverOpen) {
      setCopied(false);
    }
  }, [isPopoverOpen]);

  const updateColor = (newHexColor) => {
    setHexColor(newHexColor);
    onChange(parseInt(newHexColor.slice(1), 16));

    // Update history
    setColorHistory((prev) => {
      const newHistory = [newHexColor, ...prev.filter((c) => c !== newHexColor)].slice(0, 16);
      localStorage.setItem("colorPickerHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hexColor);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Popover placement="top" showArrow isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger>
        <Button
          className="w-full h-14 min-h-unit-12 px-4"
          style={{
            backgroundColor: hexColor,
            border: "2px solid #ffffff20",
          }}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Paintbrush size={18} className={parseInt(hexColor.slice(1), 16) > 0xffffff / 2 ? "text-black" : "text-white"} />
              <span className={`font-medium ${parseInt(hexColor.slice(1), 16) > 0xffffff / 2 ? "text-black" : "text-white"}`}>Accent Color</span>
            </div>
            <code className={`font-mono text-sm ${parseInt(hexColor.slice(1), 16) > 0xffffff / 2 ? "text-black" : "text-white"}`}>{hexColor.toUpperCase()}</code>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[440px]">
        <div className="px-8 py-6 space-y-4">
          {/* Color Preview and Input */}
          <div className="space-y-3">
            <ColorPreview color={hexColor} name={hexColor.toUpperCase()} />
            <div className="flex gap-2">
              <Input
                type="text"
                value={hexColor.toUpperCase()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/i.test(value)) {
                    updateColor(value.toUpperCase());
                  }
                }}
                placeholder="#000000"
                className="font-mono"
                startContent={<div className="w-4 h-4 rounded-full" style={{ backgroundColor: hexColor }} />}
                endContent={
                  <Button isIconOnly size="sm" variant="light" onClick={copyToClipboard}>
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </Button>
                }
              />
            </div>
          </div>

          <Divider />

          {/* Color History */}
          {colorHistory.length > 0 && (
            <>
              <ColorHistory history={colorHistory} onSelect={updateColor} selectedColor={hexColor} />
              <Divider />
            </>
          )}

          {/* Color Tabs */}
          <Tabs aria-label="Color options" size="sm" className="flex-1">
            <Tab
              key="discord"
              title={
                <div className="flex items-center gap-2">
                  <Star size={16} />
                  <span>Discord</span>
                </div>
              }
            >
              <div className="pt-4">
                <ColorGrid colors={DISCORD_COLORS} onSelect={updateColor} selectedColor={hexColor} />
              </div>
            </Tab>
            <Tab
              key="material"
              title={
                <div className="flex items-center gap-2">
                  <Palette size={16} />
                  <span>Material</span>
                </div>
              }
            >
              <div className="pt-4">
                <ColorGrid colors={MATERIAL_COLORS} onSelect={updateColor} selectedColor={hexColor} />
              </div>
            </Tab>
            <Tab
              key="tailwind"
              title={
                <div className="flex items-center gap-2">
                  <Grid size={16} />
                  <span>Tailwind</span>
                </div>
              }
            >
              <div className="pt-4">
                <ColorGrid colors={TAILWIND_COLORS} onSelect={updateColor} selectedColor={hexColor} />
              </div>
            </Tab>
            <Tab
              key="custom"
              title={
                <div className="flex items-center gap-2">
                  <Palette size={16} />
                  <span>Custom</span>
                </div>
              }
            >
              <div className="pt-4">
                <CustomColorPicker color={hexColor} onChange={updateColor} />
              </div>
            </Tab>
          </Tabs>

          {/* Quick Actions */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2">
              <Tooltip content="Clear History">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  isDisabled={colorHistory.length === 0}
                  onClick={() => {
                    setColorHistory([]);
                    localStorage.removeItem("colorPickerHistory");
                  }}
                >
                  <History size={16} />
                </Button>
              </Tooltip>
            </div>
            <Tooltip content={copied ? "Copied!" : "Copy HEX Code"}>
              <Button size="sm" variant="light" onClick={copyToClipboard} startContent={copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </Tooltip>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
