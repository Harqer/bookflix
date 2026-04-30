import { TextInput, type TextInputProps, View } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
  icon?: React.ReactNode;
}

export function Input({ className, icon, ...props }: InputProps) {
  return (
    <View
      className={cn(
        "flex flex-row items-center h-14 w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4",
        className
      )}
    >
      {icon && <View className="mr-3">{icon}</View>}
      <TextInput
        className="flex-1 text-base text-zinc-100 placeholder:text-zinc-500"
        placeholderTextColor="#71717a"
        {...props}
      />
    </View>
  );
}
