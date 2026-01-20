FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build -- --configuration=production

FROM nginx:stable-alpine

COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 81
CMD ["nginx", "-g", "daemon off;"]
