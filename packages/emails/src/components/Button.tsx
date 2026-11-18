import { Button as EmailButton } from "@react-email/components";
import { colors } from "./brand";

interface ButtonProps {
	href: string;
	children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
	return (
		<EmailButton href={href} style={btn}>
			{children}
		</EmailButton>
	);
}

const btn: React.CSSProperties = {
	backgroundColor: colors.primary,
	borderRadius: 8,
	color: colors.white,
	display: "inline-block",
	fontSize: 15,
	fontWeight: 600,
	letterSpacing: "0.01em",
	padding: "14px 28px",
	textDecoration: "none",
};
