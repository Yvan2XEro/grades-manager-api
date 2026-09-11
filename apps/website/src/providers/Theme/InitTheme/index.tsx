import Script from "next/script";
import type React from "react";

import { defaultTheme, themeLocalStorageKey } from "../ThemeSelector/types";

export const InitTheme: React.FC = () => {
	return (
		// eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
		<Script
			dangerouslySetInnerHTML={{
				__html: `
  (function () {
    function getImplicitPreference() {
      var mediaQuery = '(prefers-color-scheme: dark)'
      var mql = window.matchMedia(mediaQuery)
      var hasImplicitPreference = typeof mql.matches === 'boolean'

      if (hasImplicitPreference) {
        return mql.matches ? 'dark' : 'light'
      }

      return null
    }

    function themeIsValid(theme) {
      return theme === 'light' || theme === 'dark'
    }

    var themeToSet = '${defaultTheme}'
    var preference = window.localStorage.getItem('${themeLocalStorageKey}')

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      var implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-theme', themeToSet)

    // Marks that scripting is available, before first paint. Scroll-reveal
    // animations are scoped to .js so that content stays visible when this
    // script never runs (JS disabled, blocked, or a non-executing crawler)
    // instead of being stranded at opacity 0.
    document.documentElement.classList.add('js')
  })();
  `,
			}}
			id="theme-script"
			strategy="beforeInteractive"
		/>
	);
};
