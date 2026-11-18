import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

const PasswordInput = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
	const { t } = useTranslation();
	const [showPassword, setShowPassword] = React.useState(false);

	return (
		<div className="relative">
			<Input
				type={showPassword ? "text" : "password"}
				className={cn("pr-10", className)}
				ref={ref}
				{...props}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="absolute top-0 right-0 h-full w-10 px-3 text-muted-foreground hover:text-foreground"
				onClick={() => setShowPassword(!showPassword)}
				tabIndex={-1}
			>
				{showPassword ? (
					<EyeOff className="h-4 w-4" />
				) : (
					<Eye className="h-4 w-4" />
				)}
				<span className="sr-only">
					{showPassword
						? t("common.a11y.hidePassword")
						: t("common.a11y.showPassword")}
				</span>
			</Button>
		</div>
	);
});

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
