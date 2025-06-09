FROM node:18-slim

RUN apt-get update \
  && apt-get install -y libssl1.1 || apt-get install -y libssl3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]