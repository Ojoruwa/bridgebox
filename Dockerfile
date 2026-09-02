FROM node:20-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]