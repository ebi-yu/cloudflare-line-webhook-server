/**
 * Flexメッセージの型定義
 */
export type FlexContainer = FlexBubble | FlexCarousel;

export type FlexBubble = {
	type: "bubble";
	body?: FlexBox;
	header?: FlexBox;
	footer?: FlexBox;
};

export type FlexCarousel = {
	type: "carousel";
	contents: FlexBubble[];
};

export type FlexBox = {
	type: "box";
	layout: "horizontal" | "vertical" | "baseline";
	contents: FlexComponent[];
};

export type FlexComponent = FlexBox | FlexButton | FlexText | FlexSpacer;

export type FlexButton = {
	type: "button";
	action: FlexAction;
	style?: "primary" | "secondary" | "link";
	color?: string;
	height?: "sm" | "md";
};

export type FlexText = {
	type: "text";
	text: string;
	size?: string;
	weight?: "regular" | "bold";
	color?: string;
	margin?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
};

export type FlexSpacer = {
	type: "spacer";
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
};

export type FlexAction = {
	type: "uri" | "postback" | "message";
	label: string;
	uri?: string;
	data?: string;
	text?: string;
};

/**
 * ボタンメニューのボタン定義
 */
export type ButtonMenuItem = {
	label: string;
} & (
	| { type: "uri"; uri: string }
	| { type: "postback"; data: string }
	| { type: "message"; text: string }
);

/**
 * ボタンメニュー用のFlexContainerを作成するVO
 */
export class ButtonMenuFlexContainerVo {
	private static readonly BUTTONS_PER_BUBBLE = 10;

	private constructor(public readonly container: FlexContainer) {}

	/**
	 * ボタン配列からFlexContainerを作成
	 * ボタンが10個を超える場合は自動的にcarouselとして複数のbubbleに分割
	 */
	static create(buttons: ButtonMenuItem[]): ButtonMenuFlexContainerVo {
		const buttonComponents: FlexButton[] = buttons.map((button) => ({
			type: "button",
			action: {
				type: button.type,
				label: button.label,
				...(button.type === "uri" && { uri: button.uri }),
				...(button.type === "postback" && { data: button.data }),
				...(button.type === "message" && { text: button.text }),
			},
		}));

		// 10個以下の場合は単一のbubble
		if (buttons.length <= this.BUTTONS_PER_BUBBLE) {
			const container: FlexContainer = {
				type: "bubble",
				body: {
					type: "box",
					layout: "vertical",
					contents: buttonComponents,
				},
			};
			return new ButtonMenuFlexContainerVo(container);
		}

		// 10個を超える場合はcarouselに分割
		const bubbles: FlexBubble[] = [];
		for (let i = 0; i < buttonComponents.length; i += this.BUTTONS_PER_BUBBLE) {
			const bubbleButtons = buttonComponents.slice(i, i + this.BUTTONS_PER_BUBBLE);
			bubbles.push({
				type: "bubble",
				body: {
					type: "box",
					layout: "vertical",
					contents: bubbleButtons,
				},
			});
		}

		const container: FlexContainer = {
			type: "carousel",
			contents: bubbles,
		};
		return new ButtonMenuFlexContainerVo(container);
	}
}
