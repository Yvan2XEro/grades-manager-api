import { createFileRoute } from "@tanstack/react-router";
import About from "../components/sections/About";
import Features from "../components/sections/Features";
import Hero from "../components/sections/Hero";
import Pricing from "../components/sections/Pricing";
import Screenshots from "../components/sections/Screenshots";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<main>
			<Hero />
			<Features />
			<Screenshots />
			<Pricing />
			<About />
		</main>
	);
}
