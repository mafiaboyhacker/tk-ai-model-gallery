# Railway 배포용 Dockerfile
FROM node:22-alpine

# 작업 디렉토리 설정
WORKDIR /app

# ai-model-gallery 폴더 전체 복사
COPY ai-model-gallery/package*.json ./
RUN npm install --production=false

# 앱 소스 복사
COPY ai-model-gallery/ ./

# Prisma 클라이언트 생성
RUN npx prisma generate

# 앱 빌드
RUN npm run build

# 포트 노출
EXPOSE 3000

# 앱 시작
CMD ["npm", "run", "start"]