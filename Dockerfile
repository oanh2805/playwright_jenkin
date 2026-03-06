# ============================================================
# Test Runner Image
# Uses the official Microsoft Playwright image which already
# contains Node.js + all browser binaries (Chromium, Firefox, WebKit)
# ============================================================
FROM mcr.microsoft.com/playwright:v1.58.2-jammy
WORKDIR /app
# Install dependencies first (layer-cache friendly)
COPY package*.json ./
RUN npm ci
# Copy the rest of the project
COPY . .
# Default command – overridden by Jenkins via docker run ... npm run test:ci
# ENV / BROWSER env vars are injected at runtime by the pipeline
CMD ["npm", "run", "test:ci"]