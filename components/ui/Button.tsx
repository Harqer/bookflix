import { Text, Pressable, type PressableProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex flex-row items-center justify-center rounded-md text-sm font-medium transition-colors active:opacity-80 disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-red-600 text-white", // Netflix Red
        destructive: "bg-red-900 text-white",
        outline: "border border-zinc-700 bg-transparent text-zinc-100",
        secondary: "bg-zinc-800 text-zinc-100",
        ghost: "bg-transparent text-zinc-100",
        link: "bg-transparent text-zinc-300 underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const textVariants = cva("font-medium", {
  variants: {
    variant: {
      default: "text-white text-base font-bold",
      destructive: "text-white",
      outline: "text-zinc-100",
      secondary: "text-zinc-100",
      ghost: "text-zinc-100",
      link: "text-zinc-300 underline",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  label: string;
}

export function Button({
  className,
  variant,
  size,
  label,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <Text className={cn(textVariants({ variant }))}>{label}</Text>
    </Pressable>
  );
}
