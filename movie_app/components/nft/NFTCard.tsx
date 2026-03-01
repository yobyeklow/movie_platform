import React from "react";

interface NFTCardProps {
  tier: "bronze" | "silver" | "gold";
  name: string;
  symbol: string;
  description: string;
  image: string;
  price: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export default function NFTCard({
  tier,
  name,
  symbol,
  description,
  image,
  price,
  selected,
  onSelect,
  disabled = false,
}: NFTCardProps) {
  const getAccentColor = () => {
    switch (tier) {
      case "bronze":
        return "#cfff04";
      case "silver":
        return "#e5e5e5";
      case "gold":
        return "#ff6b35";
      default:
        return "#cfff04";
    }
  };

  const accentColor = getAccentColor();

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        relative brutal-border bg-[#0a0a0a] overflow-hidden transition-all duration-300
        hover:scale-105 w-full
        ${selected ? "border-2 ring-2" : "border-2 border-[#222]"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={{
        borderColor: selected ? accentColor : "",
        boxShadow: selected ? `0 0 0 2px ${accentColor}` : "",
      }}
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden img-noise">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent/50 to-black/50"></div>
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ${selected?"grayscale-0":""}`}
        />
      </div>

      {/* Info Section */}
      <div className="p-6 border-t-2 border-[#222] bg-[#050505]">
        {/* Tier Badge */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="px-4 py-2 font-mono text-[10px] tracking-wider bg-[#0a0a0a] border-2 border-[#222] text-white uppercase"
          >
            {symbol}
          </span>
          {selected && (
            <span 
              className="px-2 py-1 font-mono text-[9px] font-bold text-black"
              style={{ backgroundColor: accentColor }}
            >
              SELECTED
            </span>
          )}
        </div>

        {/* Name & Description */}
        <div className="mb-4">
          <h3 className="font-display font-black text-xl text-white mb-2 tracking-tight">
            {name}
          </h3>
          <p className="font-mono text-[10px] text-[#e5e5e5]/60 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-[#222]">
          <span className="font-mono text-[10px] text-[#e5e5e5]/40">
            PRICE
          </span>
          <span 
            className="font-display font-black text-3xl"
            style={{ color: accentColor }}
          >
            {price} USDC
          </span>
        </div>

        {/* Selection Indicator */}
        <div className="absolute top-4 right-4">
          <div 
            className="w-8 h-8 border-2 flex items-center justify-center transition-all"
            style={{ 
              borderColor: selected ? accentColor : "#222",
              backgroundColor: selected ? accentColor : "transparent"
            }}
          >
            {selected && (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* Decorative Corner */}
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 border-l-2 border-t-2 opacity-50"
          style={{ borderColor: accentColor }}
        />
      </div>
    </button>
  );
}
