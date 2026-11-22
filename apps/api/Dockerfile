FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production
EXPOSE 4000
# Uses committed migrations when present (recommended), otherwise creates the schema with `db push` (first run).
CMD ["sh","-c","if [ -d prisma/migrations ] && [ -n \"$(ls -A prisma/migrations 2>/dev/null)\" ]; then npx prisma migrate deploy; else npx prisma db push --skip-generate; fi && node dist/index.js"]
