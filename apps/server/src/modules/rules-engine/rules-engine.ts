import { Engine } from "json-rules-engine";
import { promotionRules } from "./default-rules";

const promotionEngine = new Engine(promotionRules);

export async function evaluatePromotionFacts(facts: {
	creditsEarned: number;
	requiredCredits: number;
}) {
	const { events } = await promotionEngine.run(facts);
	return events.some((event) => event.type === "promotion-eligible");
}
