FROM jenkins/jenkins:jdk21

USER root

# 1. Install Node.js (Version 20 LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && apt-get install -y \
    nodejs \
    git \
    curl \
    ca-certificates \
    # 2. Essential Browser Dependencies (Required for TypeScript/Playwright)
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxshmfence1 \
    libxcb1 \
    libxext6 \
    libxfixes3 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# 3. Verify installations
RUN node -v && npm -v

# 4. Install Playwright
RUN npx playwright install-deps chromium

# Switch back to the jenkins user
USER jenkins