import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { keycloakify } from 'keycloakify/vite-plugin'
import { defineConfig } from 'vite'

// Keycloak login theme "arcforge" for accounts.arcforge.au. The platform
// repo mounts the JAR into Keycloak 26.8 and sets it as the realm's login
// theme. Only one JAR is built: the one for Keycloak 26 and later.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keycloakify({
      themeName: 'arcforge',
      accountThemeImplementation: 'none',
      keycloakVersionTargets: {
        '22-to-25': false,
        'all-other-versions': 'arcforge-keycloak-theme.jar',
      },
    }),
  ],
})
