"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox@1.1.4";
import { Check } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			data-slot="checkbox"
			className={cn(
				"peer h-5 w-5 shrink-0 rounded-sm border border-gray-300 bg-white transition-all",
				"hover:bg-gray-50",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"data-[state=checked]:bg-gray-900 data-[state=checked]:text-white data-[state=checked]:border-gray-900",
				className,
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator
				data-slot="checkbox-indicator"
				className={cn(
					"flex items-center justify-center text-current"
				)}
			>
				<Check className="h-4 w-4 font-bold stroke-[3]" />
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
