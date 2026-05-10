import React from "react";
import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { cn } from "@/lib/utils";

// 🏛️ Sovereign Button System (Zero-Dependency Refactor)
const variants = {
  default: "bg-[#3F00FF]", // 💎 Ultramarine Action
  destructive: "bg-red-950", 
  outline: "border border-[#D4AF37] bg-transparent", // 🍾 Champagne Gold Filigree
  secondary: "bg-[#12142B] border border-[#2D2D4A]", // Midnight Indigo
  ghost: "bg-transparent",
  link: "bg-transparent underline",
  prestige: "bg-[#D4AF37]", // 🍾 Champagne Gold Result
  lapis: "bg-[#26619C]", // 💎 Lapis Blue Mastery
  sovereign: "bg-[#FF8A00]", // ⚡ Electric Orange (Directorial Action)
};

const sizes = {
  default: "h-12 px-6 py-3 rounded-xl",
  sm: "h-9 rounded-md px-3",
  lg: "h-14 rounded-md px-8",
  icon: "h-10 w-10",
};

const textVariants = {
  default: "text-white",
  destructive: "text-red-200",
  outline: "text-[#D4AF37]",
  secondary: "text-[#ECECEC]",
  ghost: "text-[#ECECEC]",
  link: "text-[#3F00FF] underline",
  prestige: "text-black font-bold",
  lapis: "text-white",
  sovereign: "text-white font-bold",
};

export interface ButtonProps extends TouchableOpacityProps {
  label?: string;
  children?: React.ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  label,
  children,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className={cn(
        "flex flex-row items-center justify-center transition-opacity disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children || (
        <Text className={cn("text-base font-bold text-center", textVariants[variant])}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
